import { describe, expect, it } from 'vitest';
import {
  applyLogicalReminderOutcome,
  applyLogicalReminderOutcomes,
  WORK_SESSION_STREAK_ADVANCEMENT_COINS,
  workSessionStreakCoinTransactionId,
  createDefaultWorkSessionStreakValue,
} from '@/modules/work-session-streak';

describe('applyLogicalReminderOutcome', () => {
  it('advances the streak and awards ten Coins for a satisfied logical outcome', () => {
    const applied = applyLogicalReminderOutcome(createDefaultWorkSessionStreakValue(), {
      logicalOutcomeId: 'occ-1',
      occurrenceIds: ['occ-1'],
      outcome: 'satisfied',
      resolvedAtEpochMs: 1_000,
      workSessionId: 'ws-1',
    });
    expect(applied).toMatchObject({
      kind: 'advanced',
      streak: { count: 1, processedLogicalOutcomeIds: ['occ-1'] },
      coinCredit: {
        transactionId: workSessionStreakCoinTransactionId('occ-1'),
        amount: WORK_SESSION_STREAK_ADVANCEMENT_COINS,
        reasonCode: 'work-session-streak',
      },
    });
  });

  it('resets the streak once for a missed logical outcome without awarding Coins', () => {
    const applied = applyLogicalReminderOutcome(
      { count: 4, processedLogicalOutcomeIds: ['prior'] },
      {
        logicalOutcomeId: 'occ-2',
        occurrenceIds: ['occ-2'],
        outcome: 'missed',
        resolvedAtEpochMs: 2_000,
      }
    );
    expect(applied).toEqual({
      kind: 'reset',
      streak: { count: 0, processedLogicalOutcomeIds: ['prior', 'occ-2'] },
    });
  });

  it('ignores duplicate logical outcomes', () => {
    const streak = { count: 2, processedLogicalOutcomeIds: ['occ-1'] };
    const applied = applyLogicalReminderOutcome(streak, {
      logicalOutcomeId: 'occ-1',
      occurrenceIds: ['occ-1'],
      outcome: 'satisfied',
      resolvedAtEpochMs: 1_000,
      workSessionId: 'ws-1',
    });
    expect(applied).toEqual({ kind: 'unchanged', streak });
  });

  it('applies coalesced outcomes once and awards one Coin credit per advancement', () => {
    const result = applyLogicalReminderOutcomes(createDefaultWorkSessionStreakValue(), [
      {
        logicalOutcomeId: 'occ-1+occ-2',
        occurrenceIds: ['occ-1', 'occ-2'],
        outcome: 'satisfied',
        resolvedAtEpochMs: 1_000,
        workSessionId: 'ws-1',
      },
    ]);
    expect(result.streak.count).toBe(1);
    expect(result.coinCredits).toHaveLength(1);
    expect(result.coinCredits[0]?.transactionId).toBe(
      workSessionStreakCoinTransactionId('occ-1+occ-2')
    );
  });
});
