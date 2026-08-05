import browser from 'webextension-polyfill';
import { computePhaseEndTime } from '@/Background/Services/Scheduler/SchedulerService';
import { SCHEDULER_ALARM } from '@/Shared/Constants/Constants';
import type { SchedulerState } from '@/Shared/Types/AppState';

export const activePhaseHasEndAlarm = async (phaseEnd: Date): Promise<boolean> => {
  const existing = await browser.alarms.get(SCHEDULER_ALARM.PHASE_END);
  if (existing === undefined) {
    return false;
  }

  return Math.abs(existing.scheduledTime - phaseEnd.getTime()) < 1000;
};

export const schedulePhaseEndAlarm = async (scheduler: SchedulerState): Promise<void> => {
  await browser.alarms.clear(SCHEDULER_ALARM.PHASE_END);

  const phaseEnd = computePhaseEndTime(scheduler);
  if (phaseEnd !== null) {
    await browser.alarms.create(SCHEDULER_ALARM.PHASE_END, { when: phaseEnd.getTime() });
  }
};
