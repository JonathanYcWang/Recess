import type {
  ReminderOccurrence,
  ReminderSchedule,
  WorkStartReminderValue,
} from './workStartReminderDocument';
import { addCalendarDays, resolveLocalWallTimeOnDate, weekdayInTimeZone } from './localTimeZone';
import { getZonedParts } from './localTimeZone';

export const WORK_START_REMINDER_ALARM_PREFIX = 'work-start-reminder-occ-';

export const workStartReminderAlarmName = (occurrenceId: string): string =>
  `${WORK_START_REMINDER_ALARM_PREFIX}${occurrenceId}`;

export const parseAlarmOccurrenceId = (alarmName: string): string | null => {
  if (!alarmName.startsWith(WORK_START_REMINDER_ALARM_PREFIX)) {
    return null;
  }
  const occurrenceId = alarmName.slice(WORK_START_REMINDER_ALARM_PREFIX.length);
  return occurrenceId.length > 0 ? occurrenceId : null;
};

export const resolveLocalTimeZoneId = (): string =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

export const computeNextOccurrenceEpochMs = (
  schedule: ReminderSchedule,
  nowEpochMs: number,
  timeZoneId: string
): number | null => {
  if (!schedule.enabled || !schedule.weekdays.some(Boolean)) {
    return null;
  }

  const nowParts = getZonedParts(nowEpochMs, timeZoneId);
  let best: number | null = null;

  for (let dayOffset = 0; dayOffset < 14; dayOffset += 1) {
    const date = addCalendarDays(nowParts.year, nowParts.month, nowParts.day, dayOffset);
    const weekday = weekdayInTimeZone(date.year, date.month, date.day, timeZoneId);
    if (!schedule.weekdays[weekday]) {
      continue;
    }
    const resolved = resolveLocalWallTimeOnDate(
      date.year,
      date.month,
      date.day,
      schedule.localTime,
      timeZoneId
    );
    if (!resolved) {
      continue;
    }
    const epoch = resolved.epochMs;
    if (epoch > nowEpochMs && (best === null || epoch < best)) {
      best = epoch;
    }
  }

  return best;
};

export const cloneWorkStartReminderValue = (
  value: WorkStartReminderValue
): WorkStartReminderValue => ({
  schedules: value.schedules.map((schedule) => ({
    ...schedule,
    localTime: { ...schedule.localTime },
    weekdays: [...schedule.weekdays] as ReminderSchedule['weekdays'],
  })),
  occurrences: value.occurrences.map((occurrence) => ({ ...occurrence })),
  planningTimeZoneId: value.planningTimeZoneId,
});

export const applyTimeZoneContext = (
  value: WorkStartReminderValue,
  timeZoneId: string
): WorkStartReminderValue => {
  if (value.planningTimeZoneId === timeZoneId) {
    return value;
  }
  return {
    ...value,
    planningTimeZoneId: timeZoneId,
    occurrences: value.occurrences.filter((occurrence) => occurrence.phase !== 'planned'),
  };
};

const retainNonPlannedOccurrences = (occurrences: readonly ReminderOccurrence[]) =>
  occurrences.filter((occurrence) => occurrence.phase !== 'planned');

export const replanReminderOccurrences = (
  value: WorkStartReminderValue,
  nowEpochMs: number,
  createOccurrenceId: () => string,
  timeZoneId: string = resolveLocalTimeZoneId()
): WorkStartReminderValue => {
  const withZone = applyTimeZoneContext(value, timeZoneId);
  const retained = retainNonPlannedOccurrences(withZone.occurrences);
  const planned: ReminderOccurrence[] = [];

  for (const schedule of withZone.schedules) {
    if (!schedule.enabled) {
      continue;
    }
    const hasOpenOccurrence = retained.some(
      (occurrence) =>
        occurrence.scheduleId === schedule.id &&
        (occurrence.phase === 'planned' || occurrence.phase === 'active')
    );
    if (hasOpenOccurrence) {
      continue;
    }
    const existingPlanned = withZone.occurrences.find(
      (occurrence) => occurrence.scheduleId === schedule.id && occurrence.phase === 'planned'
    );
    const nextEpoch = computeNextOccurrenceEpochMs(schedule, nowEpochMs, timeZoneId);
    if (nextEpoch === null) {
      continue;
    }
    if (
      existingPlanned &&
      existingPlanned.scheduledEpochMs === nextEpoch &&
      existingPlanned.timeZoneId === timeZoneId
    ) {
      planned.push(existingPlanned);
      continue;
    }
    const occurrenceId = createOccurrenceId();
    planned.push({
      id: occurrenceId,
      scheduleId: schedule.id,
      scheduledEpochMs: nextEpoch,
      timeZoneId,
      phase: 'planned',
      alarmName: workStartReminderAlarmName(occurrenceId),
    });
  }

  return {
    schedules: withZone.schedules,
    planningTimeZoneId: timeZoneId,
    occurrences: [...retained, ...planned],
  };
};

export const activateOccurrenceByAlarm = (
  value: WorkStartReminderValue,
  alarmName: string
): { value: WorkStartReminderValue; occurrenceId: string | null } => {
  const occurrenceId = parseAlarmOccurrenceId(alarmName);
  if (!occurrenceId) {
    return { value, occurrenceId: null };
  }
  const index = value.occurrences.findIndex((occurrence) => occurrence.id === occurrenceId);
  if (index < 0) {
    return { value, occurrenceId: null };
  }
  const current = value.occurrences[index];
  if (current.phase !== 'planned') {
    return { value, occurrenceId: null };
  }
  const next = cloneWorkStartReminderValue(value);
  next.occurrences[index] = { ...next.occurrences[index], phase: 'active' };
  return { value: next, occurrenceId };
};
