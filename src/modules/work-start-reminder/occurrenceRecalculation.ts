import type {
  ReminderOccurrence,
  ReminderSchedule,
  WorkStartReminderValue,
} from './workStartReminderDocument';
import { getZonedParts, resolveLocalWallTimeOnDate, weekdayInTimeZone } from './localTimeZone';
import { cloneWorkStartReminderValue, workStartReminderAlarmName } from './occurrencePlanning';

export const OCCURRENCE_ELIGIBILITY_WINDOW_MS = 15 * 60 * 1000;

export const isSameLocalDay = (
  epochMs: number,
  anchorEpochMs: number,
  timeZoneId: string
): boolean => {
  const a = getZonedParts(epochMs, timeZoneId);
  const b = getZonedParts(anchorEpochMs, timeZoneId);
  return a.year === b.year && a.month === b.month && a.day === b.day;
};

export const resolveTodayInstantForSchedule = (
  schedule: ReminderSchedule,
  nowEpochMs: number,
  timeZoneId: string
): number | null => {
  const now = getZonedParts(nowEpochMs, timeZoneId);
  const weekday = weekdayInTimeZone(now.year, now.month, now.day, timeZoneId);
  if (!schedule.enabled || !schedule.weekdays[weekday]) {
    return null;
  }
  const resolved = resolveLocalWallTimeOnDate(
    now.year,
    now.month,
    now.day,
    schedule.localTime,
    timeZoneId
  );
  return resolved?.epochMs ?? null;
};

const isOpenTodayOccurrence = (
  occurrence: ReminderOccurrence,
  scheduleId: string,
  nowEpochMs: number,
  timeZoneId: string
): boolean =>
  occurrence.scheduleId === scheduleId &&
  (occurrence.phase === 'planned' || occurrence.phase === 'active') &&
  isSameLocalDay(occurrence.scheduledEpochMs, nowEpochMs, timeZoneId);

export const neutralizeOpenTodayOccurrences = (
  value: WorkStartReminderValue,
  scheduleId: string,
  nowEpochMs: number,
  timeZoneId: string
): WorkStartReminderValue => ({
  ...value,
  occurrences: value.occurrences.map((occurrence) =>
    isOpenTodayOccurrence(occurrence, scheduleId, nowEpochMs, timeZoneId)
      ? { ...occurrence, phase: 'resolved' as const, outcome: 'neutral' as const }
      : occurrence
  ),
});

export const occurrenceNeedsAlarm = (occurrence: ReminderOccurrence, nowEpochMs: number): boolean =>
  occurrence.phase === 'planned' ||
  (occurrence.phase === 'active' && occurrence.scheduledEpochMs > nowEpochMs);

export const recalculateScheduleOccurrences = (
  value: WorkStartReminderValue,
  scheduleId: string,
  nowEpochMs: number,
  timeZoneId: string,
  createOccurrenceId: () => string
): WorkStartReminderValue => {
  const schedule = value.schedules.find((entry) => entry.id === scheduleId);
  if (!schedule || !schedule.enabled) {
    return neutralizeOpenTodayOccurrences(value, scheduleId, nowEpochMs, timeZoneId);
  }

  const todayInstant = resolveTodayInstantForSchedule(schedule, nowEpochMs, timeZoneId);
  const existingToday = value.occurrences.find((occurrence) =>
    isOpenTodayOccurrence(occurrence, scheduleId, nowEpochMs, timeZoneId)
  );

  const withoutOpenToday = value.occurrences.filter(
    (occurrence) => !isOpenTodayOccurrence(occurrence, scheduleId, nowEpochMs, timeZoneId)
  );

  if (todayInstant === null) {
    return { ...value, occurrences: withoutOpenToday };
  }

  const msUntil = todayInstant - nowEpochMs;
  const msSince = nowEpochMs - todayInstant;
  const occurrenceId = existingToday?.id ?? createOccurrenceId();
  const base = {
    id: occurrenceId,
    scheduleId,
    scheduledEpochMs: todayInstant,
    timeZoneId,
    alarmName: workStartReminderAlarmName(occurrenceId),
  };

  if (msUntil > OCCURRENCE_ELIGIBILITY_WINDOW_MS) {
    return {
      ...value,
      occurrences: [...withoutOpenToday, { ...base, phase: 'planned' as const }],
    };
  }
  if (msSince > OCCURRENCE_ELIGIBILITY_WINDOW_MS) {
    return {
      ...value,
      occurrences: [
        ...withoutOpenToday,
        { ...base, phase: 'resolved' as const, outcome: 'missed' as const },
      ],
    };
  }

  return {
    ...value,
    occurrences: [...withoutOpenToday, { ...base, phase: 'active' as const }],
  };
};

export const recalculateAllScheduleOccurrences = (
  value: WorkStartReminderValue,
  nowEpochMs: number,
  timeZoneId: string,
  createOccurrenceId: () => string
): WorkStartReminderValue => {
  let next = cloneWorkStartReminderValue(value);
  for (const schedule of value.schedules) {
    next = recalculateScheduleOccurrences(
      next,
      schedule.id,
      nowEpochMs,
      timeZoneId,
      createOccurrenceId
    );
  }
  return next;
};
