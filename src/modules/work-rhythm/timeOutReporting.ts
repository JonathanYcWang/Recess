import { lowerMomentumOneStep } from './momentum';
import type { WorkRhythmTimeOut } from './workRhythmDocument';

export const TIME_OUT_REPORT_INTERVAL_MS = 5 * 60 * 1000;
export const TIME_OUT_MOMENTUM_LOWER_BOUNDARY = 2;

export interface TimeOutBoundaryEvent {
  boundaryIndex: number;
  elapsedMinutes: number;
  momentumLowered: boolean;
  commandId: string;
}

export interface TimeOutBoundaryAdvance {
  nextValue: WorkRhythmTimeOut;
  events: TimeOutBoundaryEvent[];
}

export const timeOutReportCommandId = (sessionId: string, boundaryIndex: number): string =>
  `time-out-report-${sessionId}-${boundaryIndex}`;

export const workRhythmTimeOutReportAlarmName = (sessionId: string): string =>
  `work-rhythm-time-out-${sessionId}`;

export const completedFiveMinuteBoundaries = (
  timeOutStartedAtEpochMs: number,
  nowEpochMs: number
): number =>
  Math.max(0, Math.floor((nowEpochMs - timeOutStartedAtEpochMs) / TIME_OUT_REPORT_INTERVAL_MS));

export const nextTimeOutBoundaryEpochMs = (timeOut: WorkRhythmTimeOut): number =>
  timeOut.timeOutStartedAtEpochMs +
  (timeOut.lastReportedFiveMinuteBoundary + 1) * TIME_OUT_REPORT_INTERVAL_MS;

export const isTimeOutReportDue = (timeOut: WorkRhythmTimeOut, nowEpochMs: number): boolean =>
  nowEpochMs >= nextTimeOutBoundaryEpochMs(timeOut);

export const advanceTimeOutBoundaries = (
  timeOut: WorkRhythmTimeOut,
  nowEpochMs: number
): TimeOutBoundaryAdvance => {
  const dueCount = completedFiveMinuteBoundaries(timeOut.timeOutStartedAtEpochMs, nowEpochMs);
  const events: TimeOutBoundaryEvent[] = [];
  let current: WorkRhythmTimeOut = { ...timeOut };

  for (
    let boundaryIndex = current.lastReportedFiveMinuteBoundary + 1;
    boundaryIndex <= dueCount;
    boundaryIndex += 1
  ) {
    let momentumLowered = false;
    if (
      boundaryIndex >= TIME_OUT_MOMENTUM_LOWER_BOUNDARY &&
      !current.momentumLoweredDuringTimeOut
    ) {
      current = {
        ...current,
        momentum: lowerMomentumOneStep(current.momentum),
        momentumLoweredDuringTimeOut: true,
      };
      momentumLowered = true;
    }

    current = {
      ...current,
      lastReportedFiveMinuteBoundary: boundaryIndex,
    };

    events.push({
      boundaryIndex,
      elapsedMinutes: boundaryIndex * 5,
      momentumLowered,
      commandId: timeOutReportCommandId(current.sessionId, boundaryIndex),
    });
  }

  return { nextValue: current, events };
};
