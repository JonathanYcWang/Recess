import { describe, expect, it } from 'vitest';
import { decideDeclineRecess } from './declineRecess';
import { decideFocusBoundarySettlement } from './settleFocusBoundary';
import type { WorkRhythmFocusBlock, WorkRhythmRecessPrompt } from './workRhythmDocument';
import { createDefaultWorkRhythmValue } from './workRhythmDocument';

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
  focusBlockStreak: 1,
  settlementSegment: 0,
  originalGoalPermanentlyComplete: false,
  isWorkSessionExtension: false,
  extensionTrancheSeconds: 0,
  extensionBaselineCumulativeSeconds: 0,
  extensionBaselineCount: 0,
  selectedTaskIds: [],
  activeTaskId: null,
  activeTaskIntervalStartedAtEpochMs: null,
  ...overrides,
});

const baseRecessPrompt = (
  overrides: Partial<WorkRhythmRecessPrompt> = {}
): WorkRhythmRecessPrompt => ({
  phase: 'recess-prompt',
  sessionId: 'ws-1',
  originalGoalSeconds: 60 * 60,
  sessionStartedAtEpochMs: 1_000_000,
  settledRemainingWorkSessionSeconds: 35 * 60,
  energy: 'steady',
  momentum: 'steady',
  focusBlockStreak: 1,
  completedFocusBlockIndex: 0,
  lastSettledSegment: 0,
  deferredRecessCount: 1,
  originalGoalPermanentlyComplete: false,
  isWorkSessionExtension: false,
  extensionTrancheSeconds: 0,
  extensionBaselineCumulativeSeconds: 0,
  extensionBaselineCount: 0,
  ...overrides,
});

describe('decideDeclineRecess', () => {
  it('continues the same focus block with scheduler-chosen extension timing', () => {
    const settled = decideFocusBoundarySettlement(baseFocus(), baseFocus().focusDeadlineAtEpochMs);
    if (!settled.ok || settled.value.nextValue.phase !== 'recess-prompt') {
      throw new Error('expected recess prompt');
    }

    const declined = decideDeclineRecess(settled.value.nextValue, {
      nowEpochMs: settled.value.nextValue.sessionStartedAtEpochMs + 60_000,
      preferredCadence: '25/5',
      selectedTaskRemainingSeconds: null,
      gameBudget: { kind: 'cards' },
    });
    expect(declined.ok).toBe(true);
    if (!declined.ok) {
      return;
    }
    expect(declined.value.nextValue).toMatchObject({
      phase: 'focus-block',
      sessionId: 'ws-1',
      focusBlockIndex: 0,
      wasExtension: true,
      settlementSegment: 1,
      focusBlockStreak: 2,
      momentum: 'steady',
    });
    expect(declined.value.nextValue.focusDurationSeconds).toBeGreaterThan(0);
    expect(declined.value.nextValue.focusDeadlineAtEpochMs).toBeGreaterThan(
      declined.value.nextValue.focusBlockStartedAtEpochMs
    );
  });

  it('rejects decline outside recess-prompt or without a deferred recess', () => {
    expect(
      decideDeclineRecess(createDefaultWorkRhythmValue(), {
        nowEpochMs: 1,
        preferredCadence: '25/5',
        selectedTaskRemainingSeconds: null,
        gameBudget: { kind: 'cards' },
      })
    ).toMatchObject({ ok: false, error: { kind: 'invalid-phase-for-decline-recess' } });

    expect(
      decideDeclineRecess(baseRecessPrompt({ deferredRecessCount: 0 }), {
        nowEpochMs: 2_000_000,
        preferredCadence: '25/5',
        selectedTaskRemainingSeconds: null,
        gameBudget: { kind: 'cards' },
      })
    ).toMatchObject({ ok: false, error: { kind: 'cannot-decline-without-deferred-recess' } });
  });
});
