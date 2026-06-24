export const FOCUS_BLOCK_STREAK_MILESTONE_INTERVAL = 3;
export const FOCUS_BLOCK_STREAK_MILESTONE_COINS = 10;

export const blocksUntilNextFocusBlockStreakMilestone = (streak: number): number => {
  const remainder = streak % FOCUS_BLOCK_STREAK_MILESTONE_INTERVAL;
  return remainder === 0
    ? FOCUS_BLOCK_STREAK_MILESTONE_INTERVAL
    : FOCUS_BLOCK_STREAK_MILESTONE_INTERVAL - remainder;
};

export const shouldAwardFocusBlockStreakMilestone = (streak: number): boolean =>
  streak > 0 && streak % FOCUS_BLOCK_STREAK_MILESTONE_INTERVAL === 0;

export const nextFocusBlockStreakAfterCompletion = (
  currentStreak: number,
  wasExtension: boolean
): number => (wasExtension ? currentStreak : currentStreak + 1);

export const focusBlockStreakCoinTransactionId = (sessionId: string, streakCount: number): string =>
  `coin-${sessionId}-focus-block-streak-${streakCount}`;
