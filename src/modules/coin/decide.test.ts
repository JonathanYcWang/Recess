import { describe, expect, it } from 'vitest';
import { applyCoinCommand } from './decide';
import { createDefaultCoinLedgerValue } from './coinDocument';
import { coinsForExtensionFocusMinutes, coinsForStandardFocusMinutes } from './duration';

describe('coin duration helpers', () => {
  it('awards one coin per completed standard focus minute', () => {
    expect(coinsForStandardFocusMinutes(0)).toBe(0);
    expect(coinsForStandardFocusMinutes(24)).toBe(24);
    expect(coinsForStandardFocusMinutes(24.9)).toBe(24);
  });

  it('awards one coin per two completed extension minutes, rounded down', () => {
    expect(coinsForExtensionFocusMinutes(0)).toBe(0);
    expect(coinsForExtensionFocusMinutes(3)).toBe(1);
    expect(coinsForExtensionFocusMinutes(4)).toBe(2);
  });
});

describe('applyCoinCommand', () => {
  it('credits and debits with approved reason codes', () => {
    const ledger = createDefaultCoinLedgerValue();
    const credit = applyCoinCommand(ledger, {
      kind: 'credit',
      transactionId: 'txn-credit-1',
      amount: 10,
      recordedAt: 100,
      reasonCode: 'standard-focus',
      context: { minutes: 10 },
    });
    expect(credit.ok).toBe(true);
    if (!credit.ok || credit.value.kind !== 'applied') {
      throw new Error('expected credit');
    }
    expect(credit.value.ledger.balance).toBe(10);

    const debit = applyCoinCommand(credit.value.ledger, {
      kind: 'debit',
      transactionId: 'txn-debit-1',
      amount: 5,
      recordedAt: 200,
      reasonCode: 'paid-reroll',
    });
    expect(debit.ok).toBe(true);
    if (!debit.ok || debit.value.kind !== 'applied') {
      throw new Error('expected debit');
    }
    expect(debit.value.ledger.balance).toBe(5);
  });

  it('returns duplicate outcomes without changing balance', () => {
    const ledger = createDefaultCoinLedgerValue();
    const first = applyCoinCommand(ledger, {
      kind: 'credit',
      transactionId: 'txn-dup',
      amount: 3,
      recordedAt: 50,
      reasonCode: 'focus-block-streak',
    });
    const second = applyCoinCommand(
      first.ok && first.value.kind === 'applied' ? first.value.ledger : ledger,
      {
        kind: 'credit',
        transactionId: 'txn-dup',
        amount: 3,
        recordedAt: 50,
        reasonCode: 'focus-block-streak',
      }
    );
    expect(second.ok).toBe(true);
    if (second.ok) {
      expect(second.value.kind).toBe('duplicate');
      expect(second.value.ledger.balance).toBe(3);
    }
  });

  it('rejects debits with insufficient funds', () => {
    const rejected = applyCoinCommand(createDefaultCoinLedgerValue(), {
      kind: 'debit',
      transactionId: 'txn-reject',
      amount: 1,
      recordedAt: 1,
      reasonCode: 'mood-boost',
    });
    expect(rejected).toMatchObject({
      ok: false,
      error: { kind: 'insufficient-funds', balance: 0, requestedDebit: 1 },
    });
  });
});
