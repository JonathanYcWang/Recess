import { createInMemoryKeyValueAdapter } from '@/adapters/browser/in-memory/inMemoryKeyValueAdapter';
import { createInMemoryWorkHistoryAdapter } from '@/adapters/browser/in-memory/inMemoryWorkHistoryAdapter';
import {
  createPersistedApplicationState,
  type PersistedApplicationState,
} from '@/modules/persisted-application-state';
import { createWorkHistoryService } from '@/modules/work-history';
import { DEFAULT_WORK_SESSION_GOAL_SECONDS } from '@/modules/work-rhythm';
import type { WorkStartReminderValue } from '@/modules/work-start-reminder';
import type { WorkSessionStreakValue } from '@/modules/work-session-streak';
import type { CoinLedgerValue } from '@/modules/coin';
import { OCCURRENCE_ELIGIBILITY_WINDOW_MS } from '@/modules/work-start-reminder';
import { createFixedClock } from '@/runtime/clock';
import { createInMemoryAlarmAdapter } from '@/runtime/alarms/inMemoryAlarmAdapter';
import { createCoinCommandHandler } from '@/runtime/background/coinCommandHandler';
import { createWorkRhythmCommandHandler } from '@/runtime/background/workRhythmCommandHandler';
import { createWorkStartReminderCommandHandler } from '@/runtime/background/workStartReminderCommandHandler';
import { createWorkRhythmCommandEnvelope } from '@/runtime/client/inProcessWorkRhythmClient';
import { createInProcessWorkStartReminderClient } from '@/runtime/client/inProcessWorkStartReminderClient';
import { createEffectExecutor } from '@/runtime/effects/effectExecutor';
import { createEffectOutcomeStore } from '@/runtime/effects/effectOutcomeStore';
import { createWorkHistoryEffectAdapter } from '@/runtime/effects/workHistoryEffectAdapter';
import {
  createInMemoryReminderNotificationAdapter,
  type ReminderNotificationAdapter,
} from '@/runtime/notifications/reminderNotificationAdapter';
import { createNoOpTimeOutReportNotifier } from '@/runtime/timeOut/timeOutReportNotifier';
import type { CoinCommandHandler } from '@/runtime/coinTypes';
import type {
  WorkStartReminderClient,
  WorkStartReminderCommandHandler,
} from '@/runtime/workStartReminderTypes';
import type { WorkRhythmCommandHandler } from '@/runtime/workRhythmTypes';

export interface WorkStartReminderVerificationState {
  reminder: WorkStartReminderValue;
  streak: WorkSessionStreakValue;
  coin: CoinLedgerValue;
}

export interface WorkStartReminderVerificationHarness {
  adapter: ReturnType<typeof createInMemoryKeyValueAdapter>;
  persistence: PersistedApplicationState;
  reminder: WorkStartReminderClient;
  reminderHandler: WorkStartReminderCommandHandler;
  workRhythmHandler: WorkRhythmCommandHandler;
  coinHandler: CoinCommandHandler;
  alarms: ReturnType<typeof createInMemoryAlarmAdapter>;
  notifications: ReminderNotificationAdapter & {
    delivered: { occurrenceId: string; scheduleId: string }[];
  };
  setNow(epochMs: number): Promise<void>;
  recreate(): Promise<void>;
  readState(): Promise<WorkStartReminderVerificationState>;
  startWorkSession(options?: {
    goalSeconds?: number;
    energy?: 'low' | 'steady' | 'high';
  }): Promise<void>;
}

export const createWorkStartReminderVerificationHarness = async (options?: {
  nowEpochMs?: number;
  notificationDeliver?: boolean;
  legacyWorkHoursJson?: string;
}): Promise<WorkStartReminderVerificationHarness> => {
  let nowEpochMs = options?.nowEpochMs ?? 1_000_000;
  const adapter = createInMemoryKeyValueAdapter();
  if (options?.legacyWorkHoursJson) {
    await adapter.set('workHours', options.legacyWorkHoursJson);
  }

  const persistence = createPersistedApplicationState({ adapter });
  const initialized = await persistence.initialize();
  if (!initialized.ok) {
    throw new Error('expected persistence initialization');
  }

  const profile = initialized.value.documents['workstyle-profile'];
  await persistence.commit([
    {
      document: 'workstyle-profile',
      expectedRevision: profile.revision,
      value: {
        ...profile.value,
        preferredCadence: '25/5',
      },
    },
  ]);

  const workHistory = createWorkHistoryService(createInMemoryWorkHistoryAdapter());
  const effectExecutor = createEffectExecutor({
    store: createEffectOutcomeStore(adapter),
    adapters: [
      createWorkHistoryEffectAdapter({
        append: async (facts) => {
          const result = await workHistory.append(facts);
          return result.ok ? { ok: true } : { ok: false, error: 'append-failed' };
        },
      }),
    ],
  });

  const alarms = createInMemoryAlarmAdapter();
  const notifications = createInMemoryReminderNotificationAdapter({
    deliver: options?.notificationDeliver ?? true,
  });

  const loadDocuments = async () => {
    const latest = await persistence.initialize();
    if (!latest.ok) {
      throw new Error('expected persistence reload');
    }
    return latest.value.documents;
  };

  let coinHandler = createCoinCommandHandler(persistence, (await loadDocuments()).coin);
  let reminderHandler!: WorkStartReminderCommandHandler;
  let workRhythmHandler!: WorkRhythmCommandHandler;

  const buildHandlers = async () => {
    const documents = await loadDocuments();
    coinHandler = createCoinCommandHandler(persistence, documents.coin);
    reminderHandler = createWorkStartReminderCommandHandler(
      persistence,
      documents['work-start-reminder'],
      {
        clock: createFixedClock(nowEpochMs),
        alarms,
        notifications,
        coinHandler,
        streakInitialized: documents['work-session-streak'],
        adapter,
      }
    );
    await reminderHandler.bootstrapPlanning();
    workRhythmHandler = createWorkRhythmCommandHandler(persistence, documents['work-rhythm'], {
      clock: createFixedClock(nowEpochMs),
      alarms,
      coinHandler,
      effectExecutor,
      timeOutReportNotifier: createNoOpTimeOutReportNotifier(),
      onWorkSessionStarted: async (input) => {
        await reminderHandler.applyWorkSessionStarted(input);
      },
    });
  };

  await buildHandlers();
  let reminderClient = createInProcessWorkStartReminderClient(reminderHandler);

  const harness: WorkStartReminderVerificationHarness = {
    adapter,
    persistence,
    get reminder() {
      return reminderClient;
    },
    get reminderHandler() {
      return reminderHandler;
    },
    get workRhythmHandler() {
      return workRhythmHandler;
    },
    get coinHandler() {
      return coinHandler;
    },
    alarms,
    notifications,
    async setNow(epochMs: number) {
      nowEpochMs = epochMs;
      await buildHandlers();
      reminderClient = createInProcessWorkStartReminderClient(reminderHandler);
    },
    recreate: async () => {
      await buildHandlers();
      reminderClient = createInProcessWorkStartReminderClient(reminderHandler);
    },
    async readState() {
      const documents = await loadDocuments();
      return {
        reminder: documents['work-start-reminder'].value,
        streak: documents['work-session-streak'].value,
        coin: documents.coin.value,
      };
    },
    async startWorkSession(sessionOptions) {
      const response = await workRhythmHandler.execute(
        createWorkRhythmCommandEnvelope({
          kind: 'start-work-session',
          goalSeconds: sessionOptions?.goalSeconds ?? DEFAULT_WORK_SESSION_GOAL_SECONDS,
          energy: sessionOptions?.energy ?? 'steady',
        })
      );
      if (!response.ok) {
        throw new Error('expected work session start');
      }
      await buildHandlers();
      reminderClient = createInProcessWorkStartReminderClient(reminderHandler);
    },
  };

  return harness;
};

export const findPlannedOccurrence = (reminder: WorkStartReminderValue) => {
  const planned = reminder.occurrences.find((occurrence) => occurrence.phase === 'planned');
  if (!planned) {
    throw new Error('expected planned occurrence');
  }
  return planned;
};

export const occurrenceDeadlineEpochMs = (scheduledEpochMs: number): number =>
  scheduledEpochMs + OCCURRENCE_ELIGIBILITY_WINDOW_MS;
