import type {
  DocumentCodec,
  Result,
  VersionedDocument,
} from '@/modules/persisted-application-state';
import { validateReminderSchedule } from './scheduleValidation';
import {
  createDefaultWorkStartReminderValue,
  type OccurrenceOutcome,
  type ReminderOccurrence,
  type WorkStartReminderValue,
} from './workStartReminderDocument';
import { WORK_START_REMINDER_ALARM_PREFIX, resolveLocalTimeZoneId } from './occurrencePlanning';

export const WORK_START_REMINDER_SCHEMA_VERSION = 2;
const SUPPORTED_SCHEMA_VERSIONS = [1, 2] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isOccurrenceOutcome = (value: unknown): value is OccurrenceOutcome =>
  value === 'neutral' || value === 'skipped';

const parseOccurrence = (value: unknown): Result<ReminderOccurrence, string> => {
  if (!isRecord(value)) {
    return { ok: false, error: 'occurrence must be an object' };
  }
  if (typeof value.id !== 'string' || value.id.length === 0) {
    return { ok: false, error: 'occurrence id must be a non-empty string' };
  }
  if (typeof value.scheduleId !== 'string' || value.scheduleId.length === 0) {
    return { ok: false, error: 'occurrence scheduleId must be a non-empty string' };
  }
  if (typeof value.scheduledEpochMs !== 'number' || !Number.isFinite(value.scheduledEpochMs)) {
    return { ok: false, error: 'occurrence scheduledEpochMs must be a finite number' };
  }
  if (typeof value.timeZoneId !== 'string' || value.timeZoneId.length === 0) {
    return { ok: false, error: 'occurrence timeZoneId must be a non-empty string' };
  }
  if (value.phase !== 'planned' && value.phase !== 'active' && value.phase !== 'resolved') {
    return { ok: false, error: 'occurrence phase must be planned, active, or resolved' };
  }
  if (
    typeof value.alarmName !== 'string' ||
    !value.alarmName.startsWith(WORK_START_REMINDER_ALARM_PREFIX)
  ) {
    return { ok: false, error: 'occurrence alarmName must use the reminder alarm prefix' };
  }
  if (value.outcome !== undefined && !isOccurrenceOutcome(value.outcome)) {
    return { ok: false, error: 'occurrence outcome must be neutral or skipped' };
  }
  if (value.phase === 'resolved' && value.outcome === undefined) {
    return { ok: false, error: 'resolved occurrence must include an outcome' };
  }
  if (value.phase !== 'resolved' && value.outcome !== undefined) {
    return { ok: false, error: 'only resolved occurrences may include an outcome' };
  }
  return {
    ok: true,
    value: {
      id: value.id,
      scheduleId: value.scheduleId,
      scheduledEpochMs: value.scheduledEpochMs,
      timeZoneId: value.timeZoneId,
      phase: value.phase,
      outcome: value.outcome,
      alarmName: value.alarmName,
    },
  };
};

const parseValue = (value: unknown): Result<WorkStartReminderValue, string> => {
  if (!isRecord(value)) {
    return { ok: false, error: 'work start reminder value must be an object' };
  }
  if (!Array.isArray(value.schedules)) {
    return { ok: false, error: 'schedules must be an array' };
  }
  if (!Array.isArray(value.occurrences)) {
    return { ok: false, error: 'occurrences must be an array' };
  }
  const schedules = [];
  for (const schedule of value.schedules) {
    const validated = validateReminderSchedule(schedule);
    if (!validated.ok) {
      return { ok: false, error: 'invalid schedule entry' };
    }
    schedules.push(validated.value);
  }
  const occurrences = [];
  for (const occurrence of value.occurrences) {
    const parsed = parseOccurrence(occurrence);
    if (!parsed.ok) {
      return { ok: false, error: parsed.error };
    }
    occurrences.push(parsed.value);
  }
  const planningTimeZoneId =
    typeof value.planningTimeZoneId === 'string' && value.planningTimeZoneId.length > 0
      ? value.planningTimeZoneId
      : resolveLocalTimeZoneId();
  return { ok: true, value: { schedules, occurrences, planningTimeZoneId } };
};

export const workStartReminderCodec: DocumentCodec<WorkStartReminderValue> = {
  schemaVersion: WORK_START_REMINDER_SCHEMA_VERSION,

  createDefault(): VersionedDocument<WorkStartReminderValue> {
    return {
      schemaVersion: WORK_START_REMINDER_SCHEMA_VERSION,
      revision: 0,
      value: createDefaultWorkStartReminderValue(),
    };
  },

  encode(document: VersionedDocument<WorkStartReminderValue>): unknown {
    return {
      schemaVersion: document.schemaVersion,
      revision: document.revision,
      value: document.value,
    };
  },

  decode(wire: unknown) {
    if (!isRecord(wire)) {
      return {
        ok: false as const,
        error: {
          kind: 'invalid-document' as const,
          message: 'Work Start Reminder document must be an object',
        },
      };
    }
    if (typeof wire.schemaVersion !== 'number') {
      return {
        ok: false as const,
        error: {
          kind: 'invalid-field' as const,
          field: 'schemaVersion',
          message: 'schemaVersion must be a number',
        },
      };
    }
    if (!SUPPORTED_SCHEMA_VERSIONS.includes(wire.schemaVersion as 1 | 2)) {
      return {
        ok: false as const,
        error: {
          kind: 'unsupported-version' as const,
          message: `Unsupported Work Start Reminder schema version ${wire.schemaVersion}`,
        },
      };
    }
    if (
      typeof wire.revision !== 'number' ||
      !Number.isInteger(wire.revision) ||
      wire.revision < 0
    ) {
      return {
        ok: false as const,
        error: {
          kind: 'invalid-field' as const,
          field: 'revision',
          message: 'revision must be a non-negative integer',
        },
      };
    }
    const value = parseValue(wire.value);
    if (!value.ok) {
      return {
        ok: false as const,
        error: {
          kind: 'invalid-field' as const,
          field: 'value',
          message: value.error,
        },
      };
    }
    return {
      ok: true as const,
      value: {
        schemaVersion: WORK_START_REMINDER_SCHEMA_VERSION,
        revision: wire.revision,
        value: value.value,
      },
    };
  },
};
