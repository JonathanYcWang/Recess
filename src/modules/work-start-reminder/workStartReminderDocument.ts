export interface LocalClockTime {
  hour: number;
  minute: number;
}

export type Weekdays = readonly [boolean, boolean, boolean, boolean, boolean, boolean, boolean];

export interface ReminderSchedule {
  id: string;
  localTime: LocalClockTime;
  weekdays: Weekdays;
  enabled: boolean;
}

export type OccurrencePhase = 'planned' | 'active' | 'resolved';

export type OccurrenceOutcome = 'neutral' | 'skipped' | 'missed' | 'satisfied';

export interface ReminderOccurrence {
  id: string;
  scheduleId: string;
  scheduledEpochMs: number;
  timeZoneId: string;
  phase: OccurrencePhase;
  outcome?: OccurrenceOutcome;
  resolvedAtEpochMs?: number;
  resolvedBySessionId?: string;
  alarmName: string;
}

export interface WorkStartReminderValue {
  schedules: ReminderSchedule[];
  occurrences: ReminderOccurrence[];
  planningTimeZoneId: string;
}

export const createDefaultWorkStartReminderValue = (): WorkStartReminderValue => ({
  schedules: [],
  occurrences: [],
  planningTimeZoneId: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
});
