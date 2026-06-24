import { describe, expect, it } from 'vitest';
import { createDefaultWorkRhythmValue } from './workRhythmDocument';
import { decideEndWorkSessionEarly } from './endWorkSessionEarly';
import type { WorkRhythmFocusBlock, WorkRhythmRecessPrompt } from './workRhythmDocument';

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
  focusBlockStreak: 0,
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

describe('decideEndWorkSessionEarly', () => {
  it('settles partial focus during an active block and transitions to inactive', () => {
    const focus = baseFocus();
    const now = focus.focusBlockStartedAtEpochMs + 10 * 60 * 1000;
    const ended = decideEndWorkSessionEarly(focus, now);
    expect(ended.ok).toBe(true);
    if (!ended.ok) {
      return;
    }
    expect(ended.value.nextValue).toEqual({ phase: 'inactive' });
    expect(ended.value.focusBlockFact?.payload).toMatchObject({
      actualFocusSeconds: 10 * 60,
      completed: false,
    });
    expect(ended.value.workSessionCompletedFact?.payload).toMatchObject({
      actualWorkedSeconds: 10 * 60,
      originalGoalPermanentlyComplete: false,
    });
    expect(ended.value.coinCredit).toMatchObject({
      amount: 10,
      reasonCode: 'standard-focus',
    });
  });

  it('uses extension coin rate for partial extension blocks', () => {
    const focus = baseFocus({
      wasExtension: true,
      focusDurationSeconds: 10 * 60,
      focusDeadlineAtEpochMs: 1_000_000 + 10 * 60 * 1000,
    });
    const now = focus.focusBlockStartedAtEpochMs + 10 * 60 * 1000;
    const ended = decideEndWorkSessionEarly(focus, now);
    expect(ended.ok).toBe(true);
    if (ended.ok) {
      expect(ended.value.coinCredit).toMatchObject({
        amount: 5,
        reasonCode: 'extension-focus',
      });
    }
  });

  it('ends from recess-prompt without re-settling focus', () => {
    const recess = baseRecessPrompt();
    const ended = decideEndWorkSessionEarly(recess, 2_000_000);
    expect(ended.ok).toBe(true);
    if (!ended.ok) {
      return;
    }
    expect(ended.value.nextValue).toEqual({ phase: 'inactive' });
    expect(ended.value.focusBlockFact).toBeUndefined();
    expect(ended.value.coinCredit).toBeUndefined();
    expect(ended.value.workSessionCompletedFact?.payload).toMatchObject({
      actualWorkedSeconds: 25 * 60,
      originalGoalPermanentlyComplete: false,
    });
  });

  it('rejects when no active work session exists', () => {
    const ended = decideEndWorkSessionEarly(createDefaultWorkRhythmValue(), 1_000_000);
    expect(ended).toMatchObject({ ok: false, error: { kind: 'no-active-work-session' } });
  });
});
