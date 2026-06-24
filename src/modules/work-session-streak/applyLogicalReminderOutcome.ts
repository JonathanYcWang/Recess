import type { LogicalReminderOutcome } from './logicalReminderOutcome';
import {
  cloneWorkSessionStreakValue,
  type WorkSessionStreakValue,
} from './workSessionStreakDocument';

export const WORK_SESSION_STREAK_ADVANCEMENT_COINS = 10;

export interface WorkSessionStreakCoinCredit {
  transactionId: string;
  amount: number;
  recordedAt: number;
  reasonCode: 'work-session-streak';
  context: Record<string, string | number | boolean | null>;
}

export type ApplyLogicalReminderOutcomeResult =
  | { kind: 'unchanged'; streak: WorkSessionStreakValue }
  | { kind: 'advanced'; streak: WorkSessionStreakValue; coinCredit: WorkSessionStreakCoinCredit }
  | { kind: 'reset'; streak: WorkSessionStreakValue };

export const workSessionStreakCoinTransactionId = (logicalOutcomeId: string): string =>
  `coin-work-session-streak-${logicalOutcomeId}`;

export const applyLogicalReminderOutcome = (
  streak: WorkSessionStreakValue,
  outcome: LogicalReminderOutcome
): ApplyLogicalReminderOutcomeResult => {
  if (streak.processedLogicalOutcomeIds.includes(outcome.logicalOutcomeId)) {
    return { kind: 'unchanged', streak };
  }

  const processedLogicalOutcomeIds = [
    ...streak.processedLogicalOutcomeIds,
    outcome.logicalOutcomeId,
  ];

  if (outcome.outcome === 'missed') {
    return {
      kind: 'reset',
      streak: cloneWorkSessionStreakValue({
        count: 0,
        processedLogicalOutcomeIds,
      }),
    };
  }

  const count = streak.count + 1;
  return {
    kind: 'advanced',
    streak: cloneWorkSessionStreakValue({
      count,
      processedLogicalOutcomeIds,
    }),
    coinCredit: {
      transactionId: workSessionStreakCoinTransactionId(outcome.logicalOutcomeId),
      amount: WORK_SESSION_STREAK_ADVANCEMENT_COINS,
      recordedAt: outcome.resolvedAtEpochMs,
      reasonCode: 'work-session-streak',
      context: {
        logicalOutcomeId: outcome.logicalOutcomeId,
        streakCount: count,
        workSessionId: outcome.workSessionId ?? null,
      },
    },
  };
};

export const applyLogicalReminderOutcomes = (
  streak: WorkSessionStreakValue,
  outcomes: readonly LogicalReminderOutcome[]
): { streak: WorkSessionStreakValue; coinCredits: WorkSessionStreakCoinCredit[] } => {
  let next = cloneWorkSessionStreakValue(streak);
  const coinCredits: WorkSessionStreakCoinCredit[] = [];
  for (const outcome of outcomes) {
    const applied = applyLogicalReminderOutcome(next, outcome);
    next = applied.streak;
    if (applied.kind === 'advanced') {
      coinCredits.push(applied.coinCredit);
    }
  }
  return { streak: next, coinCredits };
};
