import { formatScheduleTimeForDisplay } from './decide';
import type { ReminderSchedule, WorkStartReminderValue } from './workStartReminderDocument';

export interface ReminderScheduleProjection {
  id: string;
  time: string;
  days: boolean[];
  enabled: boolean;
}

export interface WorkStartReminderSnapshot {
  schedules: ReminderScheduleProjection[];
}

export const projectReminderSchedule = (
  schedule: ReminderSchedule
): ReminderScheduleProjection => ({
  id: schedule.id,
  time: formatScheduleTimeForDisplay(schedule),
  days: [...schedule.weekdays],
  enabled: schedule.enabled,
});

export const projectWorkStartReminderSnapshot = (
  value: WorkStartReminderValue
): WorkStartReminderSnapshot => ({
  schedules: value.schedules.map(projectReminderSchedule),
});
