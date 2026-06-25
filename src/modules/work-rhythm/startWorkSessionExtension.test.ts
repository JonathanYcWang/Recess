import { describe, expect, it } from 'vitest';
import { createDefaultWorkRhythmValue } from './workRhythmDocument';
import {
  decideStartWorkSessionExtension,
  startWorkSessionExtensionCommandId,
  toWorkSessionCompletedPhase,
} from './startWorkSessionExtension';
import type { WorkRhythmFocusBlock, WorkRhythmWorkSessionCompleted } from './workRhythmDocument';
import { decideFocusBoundarySettlement } from './settleFocusBoundary';
import { WORK_SESSION_EXTENSION_CUMULATIVE_MAX_SECONDS } from './workSessionExtension';

const extensionContext = {
  nowEpochMs: 5_000_000,
  preferredCadence: '25/5' as const,
  selectedTaskRemainingSeconds: null,
  gameBudget: { kind: 'cards' as const },
};

const baseCompleted = (
  overrides: Partial<WorkRhythmWorkSessionCompleted> = {}
): WorkRhythmWorkSessionCompleted => ({
  phase: 'work-session-completed',
  sessionId: 'ws-1',
  originalGoalSeconds: 60 * 60,
  cumulativeExtensionSeconds: 0,
  extensionCount: 0,
  energy: 'steady',
  momentum: 'steady',
  focusBlockStreak: 2,
  lastCompletedFocusBlockIndex: 1,
  originalGoalPermanentlyComplete: true,
  sessionCompletedAtEpochMs: 4_000_000,
  ...overrides,
});

const baseExtensionFocus = (
  overrides: Partial<WorkRhythmFocusBlock> = {}
): WorkRhythmFocusBlock => ({
  phase: 'focus-block',
  sessionId: 'ws-1',
  originalGoalSeconds: 60 * 60,
  sessionStartedAtEpochMs: 5_000_000,
  remainingWorkSessionSeconds: 30 * 60,
  settledRemainingWorkSessionSeconds: 30 * 60,
  energy: 'steady',
  momentum: 'steady',
  focusBlockIndex: 2,
  focusBlockStartedAtEpochMs: 5_000_000,
  focusDeadlineAtEpochMs: 5_000_000 + 30 * 60 * 1000,
  focusDurationSeconds: 30 * 60,
  isFinalFocus: true,
  wasExtension: false,
  schedulerReasons: [{ code: 'final-focus-exact', focusDeltaMinutes: 30, recessDeltaMinutes: 0 }],
  focusBlockStreak: 2,
  settlementSegment: 0,
  originalGoalPermanentlyComplete: true,
  isWorkSessionExtension: true,
  extensionTrancheSeconds: 30 * 60,
  extensionBaselineCumulativeSeconds: 0,
  extensionBaselineCount: 0,
  selectedTaskIds: [],
  activeTaskId: null,
  activeTaskIntervalStartedAtEpochMs: null,
  ...overrides,
});

describe('startWorkSessionExtension', () => {
  it('starts an extension focus block from work-session-completed', () => {
    const completed = baseCompleted();
    const started = decideStartWorkSessionExtension(completed, 30 * 60, extensionContext);
    expect(started.ok).toBe(true);
    if (!started.ok) {
      return;
    }
    expect(started.value.commandId).toBe(startWorkSessionExtensionCommandId('ws-1', 0));
    expect(started.value.nextValue).toMatchObject({
      phase: 'focus-block',
      sessionId: 'ws-1',
      originalGoalSeconds: 60 * 60,
      remainingWorkSessionSeconds: 30 * 60,
      isWorkSessionExtension: true,
      extensionTrancheSeconds: 30 * 60,
      extensionBaselineCumulativeSeconds: 0,
      extensionBaselineCount: 0,
      originalGoalPermanentlyComplete: true,
      wasExtension: false,
      focusBlockIndex: 2,
    });
  });

  it('rejects invalid extension goals and cumulative limits', () => {
    const completed = baseCompleted();
    expect(decideStartWorkSessionExtension(completed, 10 * 60, extensionContext)).toMatchObject({
      ok: false,
      error: { kind: 'invalid-extension-goal' },
    });
    expect(
      decideStartWorkSessionExtension(
        baseCompleted({
          cumulativeExtensionSeconds: WORK_SESSION_EXTENSION_CUMULATIVE_MAX_SECONDS,
        }),
        15 * 60,
        extensionContext
      )
    ).toMatchObject({ ok: false, error: { kind: 'extension-limit-exceeded' } });
    expect(
      decideStartWorkSessionExtension(createDefaultWorkRhythmValue(), 30 * 60, extensionContext)
    ).toMatchObject({ ok: false, error: { kind: 'invalid-phase-for-extension' } });
  });

  it('settles final extension focus back to work-session-completed without duplicate session fact', () => {
    const focus = baseExtensionFocus();
    const settled = decideFocusBoundarySettlement(focus, focus.focusDeadlineAtEpochMs);
    expect(settled.ok).toBe(true);
    if (!settled.ok) {
      return;
    }
    expect(settled.value.nextValue).toEqual(
      toWorkSessionCompletedPhase(focus, focus.focusDeadlineAtEpochMs)
    );
    expect(settled.value.workSessionCompletedFact).toBeUndefined();
  });

  it('accumulates extension seconds and count after a completed tranche', () => {
    const focus = baseExtensionFocus();
    const completed = toWorkSessionCompletedPhase(focus, focus.focusDeadlineAtEpochMs);
    expect(completed).toMatchObject({
      cumulativeExtensionSeconds: 30 * 60,
      extensionCount: 1,
      lastCompletedFocusBlockIndex: 2,
    });
  });
});
