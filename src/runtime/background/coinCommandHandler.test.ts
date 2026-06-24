import { describe, expect, it } from 'vitest';
import { createInMemoryKeyValueAdapter } from '@/adapters/browser/in-memory/inMemoryKeyValueAdapter';
import { createBackgroundCompositionRoot } from '../background/backgroundCompositionRoot';
import { RUNTIME_PROTOCOL_VERSION } from '../protocol/types';

const creditEnvelope = (commandId: string, transactionId: string) => ({
  protocolVersion: RUNTIME_PROTOCOL_VERSION,
  commandId,
  module: 'coin' as const,
  command: {
    kind: 'credit' as const,
    transactionId,
    amount: 10,
    recordedAt: 100,
    reasonCode: 'work-session-streak',
  },
});

const debitEnvelope = (commandId: string, transactionId: string) => ({
  protocolVersion: RUNTIME_PROTOCOL_VERSION,
  commandId,
  module: 'coin' as const,
  command: {
    kind: 'debit' as const,
    transactionId,
    amount: 5,
    recordedAt: 200,
    reasonCode: 'hall-pass',
  },
});

describe('coinCommandHandler', () => {
  it('persists one approved credit and debit through the runtime', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const root = await createBackgroundCompositionRoot({ adapter });
    if (!root.ok) {
      throw new Error('expected root');
    }

    const credited = await root.value.coin.command(creditEnvelope('cmd-credit', 'txn-credit'));
    expect(credited.ok).toBe(true);
    if (credited.ok) {
      expect(credited.snapshot.value.balance).toBe(10);
    }

    const debited = await root.value.coin.command(debitEnvelope('cmd-debit', 'txn-debit'));
    expect(debited.ok).toBe(true);
    if (debited.ok) {
      expect(debited.snapshot.value.balance).toBe(5);
      expect(debited.snapshot.value.transactions).toHaveLength(2);
    }
  });

  it('returns duplicate command outcomes after restart', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const root = await createBackgroundCompositionRoot({ adapter });
    if (!root.ok) {
      throw new Error('expected root');
    }

    await root.value.coin.command(creditEnvelope('cmd-replay', 'txn-replay'));
    const replayed = await root.value.coin.command(creditEnvelope('cmd-replay', 'txn-replay-2'));
    expect(replayed.ok).toBe(true);
    if (replayed.ok) {
      expect(replayed.snapshot.value.balance).toBe(10);
      expect(replayed.snapshot.value.transactions).toHaveLength(1);
    }

    const restarted = await createBackgroundCompositionRoot({ adapter });
    if (!restarted.ok) {
      throw new Error('expected restarted root');
    }
    const replayedAfterRestart = await restarted.value.coin.command(
      creditEnvelope('cmd-replay', 'txn-replay-3')
    );
    expect(replayedAfterRestart.ok).toBe(true);
    if (replayedAfterRestart.ok) {
      expect(replayedAfterRestart.snapshot.value.balance).toBe(10);
    }
  });
});
