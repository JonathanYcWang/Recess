import { describe, expect, it } from 'vitest';
import { createInMemoryKeyValueAdapter } from '@/adapters/browser/in-memory/inMemoryKeyValueAdapter';
import {
  createDiagnosticRingBuffer,
  createPersistedApplicationState,
} from '@/modules/persisted-application-state';
import {
  WORK_SESSION_STREAK_ADVANCEMENT_COINS,
  workSessionStreakCoinTransactionId,
} from '@/modules/work-session-streak';
import { createBackgroundCompositionRoot } from '@/runtime/background/backgroundCompositionRoot';

const allDays = [true, true, true, true, true, true, true] as const;

const readDocuments = async (adapter: ReturnType<typeof createInMemoryKeyValueAdapter>) => {
  const persistence = createPersistedApplicationState({
    adapter,
    diagnostics: createDiagnosticRingBuffer(),
  });
  const reminder = await persistence.read('work-start-reminder');
  const streak = await persistence.read('work-session-streak');
  const coin = await persistence.read('coin');
  if (!reminder.ok || !streak.ok || !coin.ok) {
    throw new Error('expected persisted documents');
  }
  return { reminder: reminder.value, streak: streak.value, coin: coin.value };
};

describe('workSessionStreak integration', () => {
  it('advances the streak and awards ten Coins when a reminder occurrence is satisfied', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const root = await createBackgroundCompositionRoot({ adapter });
    if (!root.ok) {
      throw new Error('expected root');
    }

    await root.value.workStartReminder.addSchedule({
      time: '09:00 AM',
      days: [...allDays],
    });

    const { reminder } = await readDocuments(adapter);
    const planned = reminder.value.occurrences.find((occurrence) => occurrence.phase === 'planned');
    if (!planned) {
      throw new Error('expected planned occurrence');
    }

    await root.value.workStartReminderHandler.applyWorkSessionStarted({
      workSessionId: 'ws-1',
      startedAtEpochMs: planned.scheduledEpochMs + 60_000,
    });

    const after = await readDocuments(adapter);
    expect(after.streak.value.count).toBe(1);
    expect(after.coin.value.balance).toBe(WORK_SESSION_STREAK_ADVANCEMENT_COINS);
    expect(after.coin.value.transactions).toHaveLength(1);
    expect(after.coin.value.transactions[0]?.reasonCode).toBe('work-session-streak');
  });

  it('does not advance or reset the streak for skip-next neutral outcomes', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const root = await createBackgroundCompositionRoot({ adapter });
    if (!root.ok) {
      throw new Error('expected root');
    }

    await root.value.workStartReminder.addSchedule({
      time: '09:00 AM',
      days: [...allDays],
    });
    const skipped = await root.value.workStartReminder.skipNext();
    expect(skipped.ok).toBe(true);

    const after = await readDocuments(adapter);
    expect(after.streak.value.count).toBe(0);
    expect(after.coin.value.balance).toBe(0);
  });

  it('does not award duplicate Coins when the same logical outcome is replayed', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const firstRoot = await createBackgroundCompositionRoot({ adapter });
    if (!firstRoot.ok) {
      throw new Error('expected root');
    }

    await firstRoot.value.workStartReminder.addSchedule({
      time: '10:00 AM',
      days: [...allDays],
    });

    const { reminder } = await readDocuments(adapter);
    const planned = reminder.value.occurrences.find((occurrence) => occurrence.phase === 'planned');
    if (!planned) {
      throw new Error('expected planned occurrence');
    }

    await firstRoot.value.workStartReminderHandler.applyWorkSessionStarted({
      workSessionId: 'ws-replay',
      startedAtEpochMs: planned.scheduledEpochMs,
    });

    const logicalOutcomeId = planned.id;
    const transactionId = workSessionStreakCoinTransactionId(logicalOutcomeId);

    const secondRoot = await createBackgroundCompositionRoot({ adapter });
    if (!secondRoot.ok) {
      throw new Error('expected restart root');
    }

    await secondRoot.value.workStartReminderHandler.applyWorkSessionStarted({
      workSessionId: 'ws-replay',
      startedAtEpochMs: planned.scheduledEpochMs + 60_000,
    });

    const after = await readDocuments(adapter);
    expect(after.streak.value.count).toBe(1);
    expect(
      after.coin.value.transactions.filter((entry) => entry.id === transactionId)
    ).toHaveLength(1);
  }, 15_000);
});
