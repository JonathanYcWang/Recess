import { formatDisplayTimeString, parseDisplayTimeString } from './localTime';
import { neutralizeOpenTodayOccurrences } from './occurrenceRecalculation';
import { isWeekdays, validateReminderSchedule } from './scheduleValidation';
import type {
  ReminderSchedule,
  Weekdays,
  WorkStartReminderValue,
} from './workStartReminderDocument';

export type ScheduleCommandError =
  | { kind: 'invalid-time-input' }
  | { kind: 'invalid-weekdays' }
  | { kind: 'schedule-not-found'; id: string };

export interface ReminderScheduleInput {
  time: string;
  weekdays: boolean[];
  enabled?: boolean;
}

const toWeekdays = (days: boolean[]): Weekdays | null =>
  isWeekdays(days) && days.some(Boolean) ? days : null;

export const decideAddSchedule = (
  value: WorkStartReminderValue,
  input: ReminderScheduleInput,
  createScheduleId: () => string
): { ok: true; value: WorkStartReminderValue } | { ok: false; error: ScheduleCommandError } => {
  const parsedTime = parseDisplayTimeString(input.time);
  if (!parsedTime.ok) {
    return { ok: false, error: { kind: 'invalid-time-input' } };
  }
  const weekdays = toWeekdays(input.weekdays);
  if (!weekdays) {
    return { ok: false, error: { kind: 'invalid-weekdays' } };
  }
  const schedule: ReminderSchedule = {
    id: createScheduleId(),
    localTime: parsedTime.value,
    weekdays,
    enabled: input.enabled ?? true,
  };
  const validated = validateReminderSchedule(schedule);
  if (!validated.ok) {
    return { ok: false, error: { kind: 'invalid-weekdays' } };
  }
  return {
    ok: true,
    value: {
      ...value,
      schedules: [...value.schedules, validated.value],
    },
  };
};

export const decideUpdateSchedule = (
  value: WorkStartReminderValue,
  id: string,
  input: ReminderScheduleInput
): { ok: true; value: WorkStartReminderValue } | { ok: false; error: ScheduleCommandError } => {
  const index = value.schedules.findIndex((schedule) => schedule.id === id);
  if (index < 0) {
    return { ok: false, error: { kind: 'schedule-not-found', id } };
  }
  const parsedTime = parseDisplayTimeString(input.time);
  if (!parsedTime.ok) {
    return { ok: false, error: { kind: 'invalid-time-input' } };
  }
  const weekdays = toWeekdays(input.weekdays);
  if (!weekdays) {
    return { ok: false, error: { kind: 'invalid-weekdays' } };
  }
  const nextSchedule: ReminderSchedule = {
    id,
    localTime: parsedTime.value,
    weekdays,
    enabled: input.enabled ?? value.schedules[index].enabled,
  };
  const validated = validateReminderSchedule(nextSchedule);
  if (!validated.ok) {
    return { ok: false, error: { kind: 'invalid-weekdays' } };
  }
  const schedules = [...value.schedules];
  schedules[index] = validated.value;
  return { ok: true, value: { ...value, schedules } };
};

export const decideDeleteSchedule = (
  value: WorkStartReminderValue,
  id: string,
  options: { nowEpochMs: number; timeZoneId: string }
): { ok: true; value: WorkStartReminderValue } | { ok: false; error: ScheduleCommandError } => {
  if (!value.schedules.some((schedule) => schedule.id === id)) {
    return { ok: false, error: { kind: 'schedule-not-found', id } };
  }
  const neutralized = neutralizeOpenTodayOccurrences(
    value,
    id,
    options.nowEpochMs,
    options.timeZoneId
  );
  return {
    ok: true,
    value: {
      schedules: neutralized.schedules.filter((schedule) => schedule.id !== id),
      occurrences: neutralized.occurrences.filter(
        (occurrence) => occurrence.scheduleId !== id || occurrence.phase === 'resolved'
      ),
      planningTimeZoneId: neutralized.planningTimeZoneId,
    },
  };
};

export const decideToggleScheduleEnabled = (
  value: WorkStartReminderValue,
  id: string
): { ok: true; value: WorkStartReminderValue } | { ok: false; error: ScheduleCommandError } => {
  const index = value.schedules.findIndex((schedule) => schedule.id === id);
  if (index < 0) {
    return { ok: false, error: { kind: 'schedule-not-found', id } };
  }
  const schedules = [...value.schedules];
  schedules[index] = { ...schedules[index], enabled: !schedules[index].enabled };
  return { ok: true, value: { ...value, schedules } };
};

export type SkipNextCommandError = { kind: 'no-planned-occurrence' };

export const decideSkipNext = (
  value: WorkStartReminderValue
): { ok: true; value: WorkStartReminderValue } | { ok: false; error: SkipNextCommandError } => {
  const planned = value.occurrences.filter((occurrence) => occurrence.phase === 'planned');
  if (planned.length === 0) {
    return { ok: false, error: { kind: 'no-planned-occurrence' } };
  }
  const next = planned.reduce((best, occurrence) =>
    occurrence.scheduledEpochMs < best.scheduledEpochMs ? occurrence : best
  );
  const occurrences = value.occurrences.map((occurrence) =>
    occurrence.id === next.id
      ? { ...occurrence, phase: 'resolved' as const, outcome: 'neutral' as const }
      : occurrence
  );
  return { ok: true, value: { ...value, occurrences } };
};

export const formatScheduleTimeForDisplay = (schedule: ReminderSchedule): string =>
  formatDisplayTimeString(schedule.localTime);
