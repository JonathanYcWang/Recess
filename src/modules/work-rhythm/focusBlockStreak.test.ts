import { describe, expect, it } from 'vitest';
import {
  blocksUntilNextFocusBlockStreakMilestone,
  FOCUS_BLOCK_STREAK_MILESTONE_COINS,
  focusBlockStreakCoinTransactionId,
  nextFocusBlockStreakAfterCompletion,
  shouldAwardFocusBlockStreakMilestone,
} from './focusBlockStreak';

describe('focusBlockStreak', () => {
  it('advances only on first completion boundaries, not extensions', () => {
    expect(nextFocusBlockStreakAfterCompletion(0, false)).toBe(1);
    expect(nextFocusBlockStreakAfterCompletion(2, false)).toBe(3);
    expect(nextFocusBlockStreakAfterCompletion(2, true)).toBe(2);
  });

  it('awards milestones at multiples of three', () => {
    expect(shouldAwardFocusBlockStreakMilestone(3)).toBe(true);
    expect(shouldAwardFocusBlockStreakMilestone(6)).toBe(true);
    expect(shouldAwardFocusBlockStreakMilestone(2)).toBe(false);
    expect(shouldAwardFocusBlockStreakMilestone(0)).toBe(false);
  });

  it('exposes blocks until the next milestone without ledger internals', () => {
    expect(blocksUntilNextFocusBlockStreakMilestone(0)).toBe(3);
    expect(blocksUntilNextFocusBlockStreakMilestone(1)).toBe(2);
    expect(blocksUntilNextFocusBlockStreakMilestone(2)).toBe(1);
    expect(blocksUntilNextFocusBlockStreakMilestone(3)).toBe(3);
  });

  it('uses stable transaction ids per milestone count', () => {
    expect(focusBlockStreakCoinTransactionId('ws-1', 3)).toBe('coin-ws-1-focus-block-streak-3');
    expect(FOCUS_BLOCK_STREAK_MILESTONE_COINS).toBe(10);
  });
});
