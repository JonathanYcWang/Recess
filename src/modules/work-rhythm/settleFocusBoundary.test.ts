import { describe, expect, it } from 'vitest';
import {
  computeActualFocusSeconds,
  decideFocusBoundarySettlement,
  isFocusBoundaryDue,
} from './settleFocusBoundary';
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
  ...overrides,
});

describe('settleFocusBoundary', () => {
  it('settles non-final focus into recess-prompt with coins and history facts', () => {
    const focus = baseFocus();
    const now = focus.focusDeadlineAtEpochMs;
    expect(isFocusBoundaryDue(focus, now)).toBe(true);
    expect(computeActualFocusSeconds(focus, now)).toBe(25 * 60);

    const settled = decideFocusBoundarySettlement(focus, now);
    expect(settled.ok).toBe(true);
    if (!settled.ok) {
      return;
    }
    expect(settled.value.nextValue).toMatchObject({
      phase: 'recess-prompt',
      deferredRecessCount: 1,
      settledRemainingWorkSessionSeconds: 60 * 60 - 25 * 60,
      focusBlockStreak: 1,
    });
    expect(settled.value.coinCredit.amount).toBe(25);
    expect(settled.value.coinCredit.reasonCode).toBe('standard-focus');
    expect(settled.value.focusBlockFact.kind).toBe('focus-block-completed');
    expect(settled.value.workSessionCompletedFact).toBeUndefined();
  });

  it('settles final focus into inactive with session completion and no recess handoff', () => {
    const focus = baseFocus({
      isFinalFocus: true,
      originalGoalSeconds: 10 * 60,
      settledRemainingWorkSessionSeconds: 10 * 60,
      focusDurationSeconds: 10 * 60,
      focusDeadlineAtEpochMs: 1_000_000 + 10 * 60 * 1000,
    });
    const settled = decideFocusBoundarySettlement(focus, focus.focusDeadlineAtEpochMs);
    expect(settled.ok).toBe(true);
    if (!settled.ok) {
      return;
    }
    expect(settled.value.nextValue).toEqual({ phase: 'inactive' });
    expect(settled.value.workSessionCompletedFact?.kind).toBe('work-session-completed');
    expect(settled.value.workSessionCompletedFact?.payload.originalGoalPermanentlyComplete).toBe(
      true
    );
  });

  it('rejects settlement before the durable boundary', () => {
    const focus = baseFocus();
    const result = decideFocusBoundarySettlement(focus, focus.focusDeadlineAtEpochMs - 1);
    expect(result).toMatchObject({ ok: false, error: { kind: 'boundary-not-due' } });
  });

  it('uses extension coin rate for extension blocks', () => {
    const focus = baseFocus({ wasExtension: true, focusDurationSeconds: 10 * 60 });
    const settled = decideFocusBoundarySettlement(focus, focus.focusDeadlineAtEpochMs);
    expect(settled.ok).toBe(true);
    if (settled.ok) {
      expect(settled.value.coinCredit.amount).toBe(5);
      expect(settled.value.coinCredit.reasonCode).toBe('extension-focus');
      expect(settled.value.nextValue).toMatchObject({ focusBlockStreak: 0 });
      expect(settled.value.streakCoinCredit).toBeUndefined();
    }
  });

  it('awards ten streak coins at the third completed focus block', () => {
    const focus = baseFocus({ focusBlockStreak: 2, focusBlockIndex: 2 });
    const settled = decideFocusBoundarySettlement(focus, focus.focusDeadlineAtEpochMs);
    expect(settled.ok).toBe(true);
    if (!settled.ok) {
      return;
    }
    expect(settled.value.nextValue).toMatchObject({ focusBlockStreak: 3 });
    expect(settled.value.streakCoinCredit).toMatchObject({
      amount: 10,
      reasonCode: 'focus-block-streak',
      transactionId: 'coin-ws-1-focus-block-streak-3',
    });
  });
});
