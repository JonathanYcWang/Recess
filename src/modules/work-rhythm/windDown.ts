import type { WorkRhythmFocusBlock } from './workRhythmDocument';

export const WIND_DOWN_LEAD_SECONDS = 2 * 60;

export type WindDownPhaseKind = 'focus-block' | 'recess';

export interface WindDownPhaseContext {
  phaseKind: WindDownPhaseKind;
  phaseEndEpochMs: number;
  phaseDurationSeconds: number;
  sessionId: string;
  segmentKey: string;
}

export const isWindDownEligible = (phaseDurationSeconds: number): boolean =>
  phaseDurationSeconds > WIND_DOWN_LEAD_SECONDS;

export const windDownBoundaryEpochMs = (phaseEndEpochMs: number): number =>
  phaseEndEpochMs - WIND_DOWN_LEAD_SECONDS * 1000;

export const isWindDownDue = (context: WindDownPhaseContext, nowEpochMs: number): boolean => {
  if (!isWindDownEligible(context.phaseDurationSeconds)) {
    return false;
  }
  const boundary = windDownBoundaryEpochMs(context.phaseEndEpochMs);
  return nowEpochMs >= boundary && nowEpochMs < context.phaseEndEpochMs;
};

export const remainingPhaseSeconds = (phaseEndEpochMs: number, nowEpochMs: number): number =>
  Math.max(0, Math.ceil((phaseEndEpochMs - nowEpochMs) / 1000));

export const isWindDownActive = (context: WindDownPhaseContext, nowEpochMs: number): boolean => {
  if (!isWindDownEligible(context.phaseDurationSeconds)) {
    return false;
  }
  const remainingSeconds = remainingPhaseSeconds(context.phaseEndEpochMs, nowEpochMs);
  return remainingSeconds <= WIND_DOWN_LEAD_SECONDS && remainingSeconds > 0;
};

export const focusBlockWindDownContext = (focus: WorkRhythmFocusBlock): WindDownPhaseContext => ({
  phaseKind: 'focus-block',
  phaseEndEpochMs: focus.focusDeadlineAtEpochMs,
  phaseDurationSeconds: focus.focusDurationSeconds,
  sessionId: focus.sessionId,
  segmentKey: `${focus.focusBlockIndex}-${focus.settlementSegment}`,
});

export const windDownCommandId = (
  sessionId: string,
  phaseKind: WindDownPhaseKind,
  segmentKey: string
): string => `wind-down-${sessionId}-${phaseKind}-${segmentKey}`;

export const workRhythmWindDownAlarmName = (sessionId: string): string =>
  `work-rhythm-wind-down-${sessionId}`;
