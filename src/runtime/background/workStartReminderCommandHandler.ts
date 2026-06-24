import type {
  KeyValueStorageAdapter,
  PersistedApplicationState,
  VersionedDocument,
} from '@/modules/persisted-application-state';
import {
  activateOccurrenceByAlarm,
  applyOccurrenceResolution,
  cloneWorkStartReminderValue,
  decideAddSchedule,
  decideDeleteSchedule,
  decideSkipNext,
  decideToggleScheduleEnabled,
  decideUpdateSchedule,
  occurrenceNeedsAlarm,
  projectWorkStartReminderSnapshot,
  recalculateAllScheduleOccurrences,
  replanReminderOccurrences,
  resolveLocalTimeZoneId,
  WORK_START_REMINDER_ALARM_PREFIX,
  type WorkStartReminderValue,
} from '@/modules/work-start-reminder';
import {
  applyLogicalReminderOutcomes,
  cloneWorkSessionStreakValue,
  extractNewLogicalReminderOutcomes,
  pendingLogicalReminderOutcomes,
  type WorkSessionStreakCoinCredit,
  type WorkSessionStreakValue,
} from '@/modules/work-session-streak';
import type { DiagnosticRingBuffer } from '@/modules/persisted-application-state/diagnostics/diagnosticRingBuffer';
import { createCommandLedger } from '../commandLedger';
import type { CommandOutcomeStore } from '../commandOutcomeStore';
import type { Clock } from '../clock';
import type { AlarmAdapter } from '../alarms/types';
import type { ReminderNotificationAdapter } from '../notifications/reminderNotificationAdapter';
import { RUNTIME_PROTOCOL_VERSION } from '../protocol/types';
import type { CoinCommandHandler } from '../coinTypes';
import {
  decodeWorkStartReminderCommandEnvelope,
  mapScheduleCommandError,
  mapSkipNextCommandError,
  type WorkStartReminderCommandEnvelope,
  type WorkStartReminderCommandError,
} from '../protocol/workStartReminderCommand';
import type {
  WorkStartReminderCommandHandler,
  WorkStartReminderCommandResponse,
  WorkStartReminderPublishedSnapshot,
  WorkStartReminderRuntimeResult,
} from '../workStartReminderTypes';

const LEGACY_WORK_HOURS_KEY = 'workHours';

const clonePublishedSnapshot = (
  snapshot: WorkStartReminderPublishedSnapshot
): WorkStartReminderPublishedSnapshot => ({
  revision: snapshot.revision,
  snapshot: {
    schedules: snapshot.snapshot.schedules.map((schedule) => ({
      ...schedule,
      days: [...schedule.days],
    })),
  },
});

const toSuccess = (
  snapshot: WorkStartReminderPublishedSnapshot
): WorkStartReminderCommandResponse => ({
  ok: true,
  revision: snapshot.revision,
  snapshot: clonePublishedSnapshot(snapshot),
});

const toFailure = (error: WorkStartReminderCommandError): WorkStartReminderCommandResponse => ({
  ok: false,
  error,
});

const toPublishedSnapshot = (
  document: VersionedDocument<WorkStartReminderValue>
): WorkStartReminderPublishedSnapshot => ({
  revision: document.revision,
  snapshot: projectWorkStartReminderSnapshot(document.value),
});

const isBooleanArray = (value: unknown): value is boolean[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === 'boolean');

const migrateLegacyWorkHours = async (
  adapter: KeyValueStorageAdapter,
  snapshot: VersionedDocument<WorkStartReminderValue>,
  createScheduleId: () => string
): Promise<VersionedDocument<WorkStartReminderValue>> => {
  if (snapshot.revision !== 0 || snapshot.value.schedules.length > 0) {
    return snapshot;
  }
  const legacy = await adapter.get(LEGACY_WORK_HOURS_KEY);
  if (!legacy.ok || legacy.value === null) {
    return snapshot;
  }
  try {
    const parsed = JSON.parse(legacy.value) as unknown;
    if (!Array.isArray(parsed)) {
      return snapshot;
    }
    let nextValue = cloneWorkStartReminderValue(snapshot.value);
    for (const entry of parsed) {
      if (!entry || typeof entry !== 'object') {
        continue;
      }
      const candidate = entry as Record<string, unknown>;
      if (typeof candidate.time !== 'string' || !isBooleanArray(candidate.days)) {
        continue;
      }
      const added = decideAddSchedule(
        nextValue,
        {
          time: candidate.time,
          weekdays: candidate.days,
          enabled: typeof candidate.enabled === 'boolean' ? candidate.enabled : true,
        },
        () =>
          typeof candidate.id === 'string' && candidate.id.length > 0
            ? candidate.id
            : createScheduleId()
      );
      if (added.ok) {
        nextValue = added.value;
        if (typeof candidate.enabled === 'boolean') {
          const index = nextValue.schedules.findIndex(
            (schedule) => schedule.id === (typeof candidate.id === 'string' ? candidate.id : '')
          );
          if (index >= 0) {
            const schedules = [...nextValue.schedules];
            schedules[index] = { ...schedules[index], enabled: candidate.enabled };
            nextValue = { ...nextValue, schedules };
          }
        }
      }
    }
    if (nextValue.schedules.length === 0) {
      return snapshot;
    }
    await adapter.remove(LEGACY_WORK_HOURS_KEY);
    return { ...snapshot, value: nextValue };
  } catch {
    return snapshot;
  }
};

export const createWorkStartReminderCommandHandler = (
  persistence: PersistedApplicationState,
  initialized: VersionedDocument<WorkStartReminderValue>,
  options: {
    clock: Clock;
    alarms: AlarmAdapter;
    notifications: ReminderNotificationAdapter;
    coinHandler: CoinCommandHandler;
    streakInitialized: VersionedDocument<WorkSessionStreakValue>;
    adapter?: KeyValueStorageAdapter;
    diagnostics?: DiagnosticRingBuffer;
    outcomeStore?: CommandOutcomeStore<WorkStartReminderCommandResponse>;
    createScheduleId?: () => string;
    createOccurrenceId?: () => string;
  }
): WorkStartReminderCommandHandler => {
  let currentDocument = {
    revision: initialized.revision,
    value: cloneWorkStartReminderValue(initialized.value),
  };
  let currentStreakDocument = {
    revision: options.streakInitialized.revision,
    value: cloneWorkSessionStreakValue(options.streakInitialized.value),
  };
  const ledger = createCommandLedger<WorkStartReminderCommandResponse>();
  const diagnostics = options.diagnostics;
  const outcomeStore = options.outcomeStore;
  const clock = options.clock;
  const alarms = options.alarms;
  const notifications = options.notifications;
  const coinHandler = options.coinHandler;
  const createScheduleId =
    options.createScheduleId ??
    (() => `rem-${clock.nowEpochMs()}-${Math.random().toString(36).slice(2, 10)}`);
  const createOccurrenceId =
    options.createOccurrenceId ??
    (() => `occ-${clock.nowEpochMs()}-${Math.random().toString(36).slice(2, 10)}`);
  const listeners = new Set<(snapshot: WorkStartReminderPublishedSnapshot) => void>();
  const reconciledAlarms = new Set<string>();

  const hydrateLedgerFromStore = async (): Promise<void> => {
    if (!outcomeStore) {
      return;
    }
    const stored = await outcomeStore.list('work-start-reminder');
    for (const entry of stored) {
      ledger.set(entry.commandId, entry.response);
    }
  };
  void hydrateLedgerFromStore();

  const publishSnapshot = (): WorkStartReminderPublishedSnapshot =>
    toPublishedSnapshot({
      schemaVersion: initialized.schemaVersion,
      revision: currentDocument.revision,
      value: currentDocument.value,
    });

  const notifyListeners = () => {
    const snapshot = publishSnapshot();
    for (const listener of listeners) {
      listener(clonePublishedSnapshot(snapshot));
    }
  };

  const syncReminderAlarms = async (
    value: WorkStartReminderValue
  ): Promise<WorkStartReminderCommandError | null> => {
    const nowEpochMs = clock.nowEpochMs();
    const planned = value.occurrences.filter((occurrence) =>
      occurrenceNeedsAlarm(occurrence, nowEpochMs)
    );
    const listed = await alarms.listAll();
    if (!listed.ok) {
      return { kind: 'alarm-schedule-failed' };
    }
    const reminderAlarms = listed.value.filter((alarm) =>
      alarm.name.startsWith(WORK_START_REMINDER_ALARM_PREFIX)
    );
    const plannedNames = new Set(planned.map((occurrence) => occurrence.alarmName));

    for (const alarm of reminderAlarms) {
      if (!plannedNames.has(alarm.name)) {
        const cleared = await alarms.clear(alarm.name);
        if (!cleared.ok) {
          return { kind: 'alarm-schedule-failed' };
        }
        reconciledAlarms.delete(alarm.name);
      }
    }

    for (const occurrence of planned) {
      const existing = reminderAlarms.find((alarm) => alarm.name === occurrence.alarmName);
      if (existing?.whenEpochMs === occurrence.scheduledEpochMs) {
        reconciledAlarms.add(occurrence.alarmName);
        continue;
      }
      if (existing) {
        const cleared = await alarms.clear(occurrence.alarmName);
        if (!cleared.ok) {
          return { kind: 'alarm-schedule-failed' };
        }
      }
      const scheduled = await alarms.schedule({
        name: occurrence.alarmName,
        whenEpochMs: occurrence.scheduledEpochMs,
      });
      if (!scheduled.ok) {
        return { kind: 'alarm-schedule-failed' };
      }
      reconciledAlarms.add(occurrence.alarmName);
    }

    return null;
  };

  const syncStreakCoinCredits = async (
    coinCredits: readonly WorkSessionStreakCoinCredit[]
  ): Promise<void> => {
    for (const credit of coinCredits) {
      await coinHandler.execute({
        protocolVersion: RUNTIME_PROTOCOL_VERSION,
        commandId: credit.transactionId,
        module: 'coin',
        command: {
          kind: 'credit',
          transactionId: credit.transactionId,
          amount: credit.amount,
          recordedAt: credit.recordedAt,
          reasonCode: credit.reasonCode,
          context: credit.context,
        },
      });
    }
  };

  const reconcilePendingStreakOutcomes = async (
    reminder: WorkStartReminderValue
  ): Promise<void> => {
    const pending = pendingLogicalReminderOutcomes(currentStreakDocument.value, reminder);
    if (pending.length === 0) {
      return;
    }
    const applied = applyLogicalReminderOutcomes(currentStreakDocument.value, pending);
    const committed = await persistence.commit([
      {
        document: 'work-session-streak',
        expectedRevision: currentStreakDocument.revision,
        value: applied.streak,
      },
    ]);
    if (!committed.ok) {
      return;
    }
    const streakDocument = committed.value.documents['work-session-streak'];
    if (!streakDocument) {
      return;
    }
    currentStreakDocument = {
      revision: streakDocument.revision,
      value: cloneWorkSessionStreakValue(streakDocument.value),
    };
    await syncStreakCoinCredits(applied.coinCredits);
  };

  const commitValue = async (
    nextValue: WorkStartReminderValue,
    options?: { workSessionStart?: { workSessionId: string; startedAtEpochMs: number } }
  ): Promise<WorkStartReminderCommandResponse> => {
    const beforeReminder = cloneWorkStartReminderValue(currentDocument.value);
    const timeZoneId = resolveLocalTimeZoneId();
    const nowEpochMs = clock.nowEpochMs();
    const resolved = applyOccurrenceResolution(nextValue, nowEpochMs, options?.workSessionStart);
    const recalculated = recalculateAllScheduleOccurrences(
      resolved,
      nowEpochMs,
      timeZoneId,
      createOccurrenceId
    );
    const replanned = replanReminderOccurrences(
      recalculated,
      nowEpochMs,
      createOccurrenceId,
      timeZoneId
    );
    const alarmError = await syncReminderAlarms(replanned);
    if (alarmError) {
      return toFailure(alarmError);
    }

    const newOutcomes = extractNewLogicalReminderOutcomes(beforeReminder, replanned);
    const streakApplied = applyLogicalReminderOutcomes(currentStreakDocument.value, newOutcomes);

    const committed = await persistence.commit([
      {
        document: 'work-start-reminder',
        expectedRevision: currentDocument.revision,
        value: replanned,
      },
      ...(newOutcomes.length > 0
        ? [
            {
              document: 'work-session-streak' as const,
              expectedRevision: currentStreakDocument.revision,
              value: streakApplied.streak,
            },
          ]
        : []),
    ]);
    if (!committed.ok) {
      if (committed.error.kind === 'conflict') {
        return toFailure({
          kind: 'stale-revision',
          expectedRevision: currentDocument.revision,
          actualRevision: committed.error.actualRevision,
        });
      }
      return toFailure({ kind: 'persistence-failed' });
    }
    const document = committed.value.documents['work-start-reminder'];
    if (!document) {
      return toFailure({ kind: 'persistence-failed' });
    }
    currentDocument = {
      revision: document.revision,
      value: cloneWorkStartReminderValue(document.value),
    };
    if (newOutcomes.length > 0) {
      const streakDocument = committed.value.documents['work-session-streak'];
      if (!streakDocument) {
        return toFailure({ kind: 'persistence-failed' });
      }
      currentStreakDocument = {
        revision: streakDocument.revision,
        value: cloneWorkSessionStreakValue(streakDocument.value),
      };
      await syncStreakCoinCredits(streakApplied.coinCredits);
    }
    notifyListeners();
    return toSuccess(publishSnapshot());
  };

  const bootstrapPlanning = async (): Promise<void> => {
    if (options.adapter) {
      const migrated = await migrateLegacyWorkHours(
        options.adapter,
        {
          schemaVersion: initialized.schemaVersion,
          revision: currentDocument.revision,
          value: currentDocument.value,
        },
        createScheduleId
      );
      if (migrated.value.schedules.length !== currentDocument.value.schedules.length) {
        currentDocument = {
          revision: migrated.revision,
          value: cloneWorkStartReminderValue(migrated.value),
        };
      }
    }
    await commitValue(currentDocument.value);
    await reconcilePendingStreakOutcomes(currentDocument.value);
  };

  const recordUnexpected = (
    commandId: string,
    error: unknown
  ): WorkStartReminderCommandResponse => {
    const message = error instanceof Error ? error.message : 'unexpected runtime failure';
    const record = diagnostics?.record({
      category: 'unexpected-runtime',
      message,
      context: { commandId, module: 'work-start-reminder' },
    });
    return toFailure({
      kind: 'unexpected-runtime',
      diagnosticId: record?.id ?? 'diag-unavailable',
    });
  };

  const applyCommand = (
    envelope: WorkStartReminderCommandEnvelope
  ):
    | { ok: true; value: WorkStartReminderValue }
    | { ok: false; error: WorkStartReminderCommandError } => {
    const command = envelope.command;
    if (command.kind === 'add-schedule') {
      if (typeof command.time !== 'string' || !isBooleanArray(command.days)) {
        return { ok: false, error: { kind: 'invalid-weekdays' } };
      }
      const decided = decideAddSchedule(
        currentDocument.value,
        {
          time: command.time,
          weekdays: command.days,
          enabled: typeof command.enabled === 'boolean' ? command.enabled : undefined,
        },
        createScheduleId
      );
      return decided.ok ? decided : { ok: false, error: mapScheduleCommandError(decided.error) };
    }
    if (command.kind === 'update-schedule') {
      if (
        typeof command.id !== 'string' ||
        typeof command.time !== 'string' ||
        !isBooleanArray(command.days)
      ) {
        return { ok: false, error: { kind: 'invalid-weekdays' } };
      }
      const decided = decideUpdateSchedule(currentDocument.value, command.id, {
        time: command.time,
        weekdays: command.days,
        enabled: typeof command.enabled === 'boolean' ? command.enabled : undefined,
      });
      return decided.ok ? decided : { ok: false, error: mapScheduleCommandError(decided.error) };
    }
    if (command.kind === 'delete-schedule') {
      if (typeof command.id !== 'string') {
        return { ok: false, error: { kind: 'schedule-not-found', id: '' } };
      }
      const decided = decideDeleteSchedule(currentDocument.value, command.id, {
        nowEpochMs: clock.nowEpochMs(),
        timeZoneId: resolveLocalTimeZoneId(),
      });
      return decided.ok ? decided : { ok: false, error: mapScheduleCommandError(decided.error) };
    }
    if (command.kind === 'skip-next') {
      const decided = decideSkipNext(currentDocument.value);
      return decided.ok ? decided : { ok: false, error: mapSkipNextCommandError(decided.error) };
    }
    if (typeof command.id !== 'string') {
      return { ok: false, error: { kind: 'schedule-not-found', id: '' } };
    }
    const decided = decideToggleScheduleEnabled(currentDocument.value, command.id);
    return decided.ok ? decided : { ok: false, error: mapScheduleCommandError(decided.error) };
  };

  const executeFresh = async (
    envelope: WorkStartReminderCommandEnvelope
  ): Promise<WorkStartReminderCommandResponse> => {
    if (
      envelope.expectedRevision !== undefined &&
      envelope.expectedRevision !== currentDocument.revision
    ) {
      return toFailure({
        kind: 'stale-revision',
        expectedRevision: envelope.expectedRevision,
        actualRevision: currentDocument.revision,
      });
    }
    const decided = applyCommand(envelope);
    if (!decided.ok) {
      return toFailure(decided.error);
    }
    return commitValue(decided.value);
  };

  return {
    current(): WorkStartReminderRuntimeResult {
      return { ok: true, value: clonePublishedSnapshot(publishSnapshot()) };
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    async bootstrapPlanning() {
      await bootstrapPlanning();
    },

    async reconcileDueReminder(alarmName: string) {
      if (!alarmName.startsWith(WORK_START_REMINDER_ALARM_PREFIX)) {
        return null;
      }
      if (!reconciledAlarms.has(alarmName)) {
        return null;
      }
      reconciledAlarms.delete(alarmName);

      const activated = activateOccurrenceByAlarm(currentDocument.value, alarmName);
      if (!activated.occurrenceId) {
        return null;
      }
      const occurrence = activated.value.occurrences.find(
        (entry) => entry.id === activated.occurrenceId
      );
      if (!occurrence) {
        return null;
      }

      const delivered = await notifications.deliver({
        occurrenceId: occurrence.id,
        scheduleId: occurrence.scheduleId,
      });

      currentDocument = {
        revision: currentDocument.revision,
        value: activated.value,
      };
      const response = await commitValue(currentDocument.value);
      if (!delivered.ok && response.ok) {
        return toFailure({ kind: 'notification-delivery-failed' });
      }
      return response;
    },

    async applyWorkSessionStarted(input: {
      workSessionId: string;
      startedAtEpochMs: number;
    }): Promise<WorkStartReminderCommandResponse> {
      return commitValue(currentDocument.value, { workSessionStart: input });
    },

    async execute(envelopeInput: unknown): Promise<WorkStartReminderCommandResponse> {
      const decoded = decodeWorkStartReminderCommandEnvelope(envelopeInput);
      if (!decoded.ok) {
        return toFailure(decoded.error);
      }
      const envelope = decoded.value;

      const cached = ledger.get(envelope.commandId);
      if (cached) {
        return cached;
      }
      if (outcomeStore) {
        const stored = await outcomeStore.get('work-start-reminder', envelope.commandId);
        if (stored) {
          ledger.set(envelope.commandId, stored);
          return stored;
        }
      }

      try {
        const response = await executeFresh(envelope);
        ledger.set(envelope.commandId, response);
        if (outcomeStore) {
          await outcomeStore.set('work-start-reminder', envelope.commandId, response);
        }
        return response;
      } catch (error) {
        const response = recordUnexpected(envelope.commandId, error);
        ledger.set(envelope.commandId, response);
        if (outcomeStore) {
          await outcomeStore.set('work-start-reminder', envelope.commandId, response);
        }
        return response;
      }
    },
  };
};
