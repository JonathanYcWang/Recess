import type { Result } from '@/runtime/persistence';
import { isLocalClockTime } from './localTime';
import type { ReminderSchedule, Weekdays } from './workStartReminderDocument';

export type ScheduleValidationError =
  | { kind: 'invalid-id' }
  | { kind: 'invalid-local-time' }
  | { kind: 'invalid-weekdays' }
  | { kind: 'schedule-not-found'; id: string };

export const isWeekdays = (value: unknown): value is Weekdays =>
  Array.isArray(value) && value.length === 7 && value.every((day) => typeof day === 'boolean');

export const validateReminderSchedule = (
  schedule: unknown
): Result<ReminderSchedule, ScheduleValidationError> => {
  if (!schedule || typeof schedule !== 'object') {
    return { ok: false, error: { kind: 'invalid-id' } };
  }
  const candidate = schedule as Record<string, unknown>;
  if (typeof candidate.id !== 'string' || candidate.id.length === 0) {
    return { ok: false, error: { kind: 'invalid-id' } };
  }
  if (!isLocalClockTime(candidate.localTime)) {
    return { ok: false, error: { kind: 'invalid-local-time' } };
  }
  if (!isWeekdays(candidate.weekdays)) {
    return { ok: false, error: { kind: 'invalid-weekdays' } };
  }
  if (typeof candidate.enabled !== 'boolean') {
    return { ok: false, error: { kind: 'invalid-weekdays' } };
  }
  if (!candidate.weekdays.some(Boolean)) {
    return { ok: false, error: { kind: 'invalid-weekdays' } };
  }
  return {
    ok: true,
    value: {
      id: candidate.id,
      localTime: candidate.localTime,
      weekdays: candidate.weekdays,
      enabled: candidate.enabled,
    },
  };
};
