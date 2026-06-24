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

export interface ReminderOccurrence {
  id: string;
  scheduleId: string;
  scheduledEpochMs: number;
  timeZoneId: string;
  phase: OccurrencePhase;
  alarmName: string;
}

export interface WorkStartReminderValue {
  schedules: ReminderSchedule[];
  occurrences: ReminderOccurrence[];
}

export const createDefaultWorkStartReminderValue = (): WorkStartReminderValue => ({
  schedules: [],
  occurrences: [],
});
