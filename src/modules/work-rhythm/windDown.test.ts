import { describe, expect, it } from 'vitest';
import {
  focusBlockWindDownContext,
  isWindDownActive,
  isWindDownDue,
  isWindDownEligible,
  type WindDownPhaseContext,
  windDownBoundaryEpochMs,
  WIND_DOWN_LEAD_SECONDS,
} from './windDown';
import type { WorkRhythmFocusBlock } from './workRhythmDocument';

const baseFocus = (overrides: Partial<WorkRhythmFocusBlock> = {}): WorkRhythmFocusBlock => ({
  phase: 'focus-block',
  sessionId: 'ws-1',
  originalGoalSeconds: 60 * 60,
  sessionStartedAtEpochMs: 1_000_000,
  remainingWorkSessionSeconds: 60 * 60,
  settledRemainingWorkSessionSeconds: 60 * 60,
  energy: 'steady',
  momentum: 'steady',
  focusBlockIndex: 0,
  focusBlockStartedAtEpochMs: 1_000_000,
  focusDeadlineAtEpochMs: 1_000_000 + 25 * 60 * 1000,
  focusDurationSeconds: 25 * 60,
  isFinalFocus: false,
  wasExtension: false,
  schedulerReasons: [{ code: 'base-cadence', focusDeltaMinutes: 25, recessDeltaMinutes: 5 }],
  focusBlockStreak: 0,
  settlementSegment: 0,
  originalGoalPermanentlyComplete: false,
  isWorkSessionExtension: false,
  extensionTrancheSeconds: 0,
  extensionBaselineCumulativeSeconds: 0,
  extensionBaselineCount: 0,
  ...overrides,
});

const recessContext = (overrides: Partial<WindDownPhaseContext> = {}): WindDownPhaseContext => ({
  phaseKind: 'recess',
  phaseEndEpochMs: 2_000_000,
  phaseDurationSeconds: 10 * 60,
  sessionId: 'ws-1',
  segmentKey: 'recess-0',
  ...overrides,
});

describe('windDown', () => {
  it('requires more than two minutes for eligibility', () => {
    expect(isWindDownEligible(WIND_DOWN_LEAD_SECONDS)).toBe(false);
    expect(isWindDownEligible(WIND_DOWN_LEAD_SECONDS + 1)).toBe(true);
  });

  it('fires exactly at the durable boundary two minutes before phase end', () => {
    const focus = baseFocus();
    const context = focusBlockWindDownContext(focus);
    const boundary = windDownBoundaryEpochMs(focus.focusDeadlineAtEpochMs);
    expect(boundary).toBe(focus.focusDeadlineAtEpochMs - WIND_DOWN_LEAD_SECONDS * 1000);
    expect(isWindDownDue(context, boundary - 1)).toBe(false);
    expect(isWindDownDue(context, boundary)).toBe(true);
    expect(isWindDownDue(context, focus.focusDeadlineAtEpochMs - 1)).toBe(true);
    expect(isWindDownDue(context, focus.focusDeadlineAtEpochMs)).toBe(false);
  });

  it('skips ineligible short phases without retroactive cues', () => {
    const focus = baseFocus({
      focusDurationSeconds: 2 * 60,
      focusDeadlineAtEpochMs: 1_000_000 + 2 * 60 * 1000,
    });
    const context = focusBlockWindDownContext(focus);
    expect(isWindDownDue(context, focus.focusBlockStartedAtEpochMs)).toBe(false);
    expect(isWindDownActive(context, focus.focusDeadlineAtEpochMs - 30_000)).toBe(false);
  });

  it('exposes an in-app active window for eligible focus blocks', () => {
    const focus = baseFocus();
    const context = focusBlockWindDownContext(focus);
    const twoMinutesBefore = focus.focusDeadlineAtEpochMs - WIND_DOWN_LEAD_SECONDS * 1000;
    expect(isWindDownActive(context, twoMinutesBefore - 1)).toBe(false);
    expect(isWindDownActive(context, twoMinutesBefore)).toBe(true);
    expect(isWindDownActive(context, focus.focusDeadlineAtEpochMs)).toBe(false);
  });

  it('shares the same phase contract for future recess integration', () => {
    const context = recessContext();
    const boundary = windDownBoundaryEpochMs(context.phaseEndEpochMs);
    expect(isWindDownDue(context, boundary)).toBe(true);
    expect(isWindDownActive(context, boundary)).toBe(true);
  });
});
