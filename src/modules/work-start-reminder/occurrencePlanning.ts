import type {
  ReminderOccurrence,
  ReminderSchedule,
  WorkStartReminderValue,
} from './workStartReminderDocument';

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
  nowEpochMs: number
): number | null => {
  if (!schedule.enabled || !schedule.weekdays.some(Boolean)) {
    return null;
  }
  const now = new Date(nowEpochMs);
  let best: number | null = null;
  for (let dayOffset = 0; dayOffset < 14; dayOffset += 1) {
    const candidate = new Date(now);
    candidate.setDate(now.getDate() + dayOffset);
    const weekday = candidate.getDay();
    if (!schedule.weekdays[weekday]) {
      continue;
    }
    candidate.setHours(schedule.localTime.hour, schedule.localTime.minute, 0, 0);
    const epoch = candidate.getTime();
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
});

const retainNonPlannedOccurrences = (occurrences: readonly ReminderOccurrence[]) =>
  occurrences.filter((occurrence) => occurrence.phase !== 'planned');

export const replanReminderOccurrences = (
  value: WorkStartReminderValue,
  nowEpochMs: number,
  createOccurrenceId: () => string
): WorkStartReminderValue => {
  const timeZoneId = resolveLocalTimeZoneId();
  const retained = retainNonPlannedOccurrences(value.occurrences);
  const planned: ReminderOccurrence[] = [];

  for (const schedule of value.schedules) {
    if (!schedule.enabled) {
      continue;
    }
    const hasActive = retained.some(
      (occurrence) => occurrence.scheduleId === schedule.id && occurrence.phase === 'active'
    );
    if (hasActive) {
      continue;
    }
    const existingPlanned = value.occurrences.find(
      (occurrence) => occurrence.scheduleId === schedule.id && occurrence.phase === 'planned'
    );
    const nextEpoch = computeNextOccurrenceEpochMs(schedule, nowEpochMs);
    if (nextEpoch === null) {
      continue;
    }
    if (existingPlanned && existingPlanned.scheduledEpochMs === nextEpoch) {
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
    schedules: value.schedules,
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
  const index = value.occurrences.findIndex(
    (occurrence) => occurrence.id === occurrenceId && occurrence.phase === 'planned'
  );
  if (index < 0) {
    return { value, occurrenceId: null };
  }
  const next = cloneWorkStartReminderValue(value);
  next.occurrences[index] = { ...next.occurrences[index], phase: 'active' };
  return { value: next, occurrenceId };
};
