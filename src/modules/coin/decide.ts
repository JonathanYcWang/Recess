import type { Result } from '@/modules/persisted-application-state/types';
import {
  cloneCoinLedgerValue,
  cloneCoinTransaction,
  COIN_REASON_CODES,
  type CoinLedgerValue,
  type CoinReasonCode,
  type CoinTransaction,
} from './coinDocument';

export type CoinCommand =
  | {
      kind: 'credit';
      transactionId: unknown;
      amount: unknown;
      recordedAt: unknown;
      reasonCode: unknown;
      context?: unknown;
    }
  | {
      kind: 'debit';
      transactionId: unknown;
      amount: unknown;
      recordedAt: unknown;
      reasonCode: unknown;
      context?: unknown;
    };

export type CoinDecisionError =
  | { kind: 'invalid-transaction-id' }
  | { kind: 'invalid-amount' }
  | { kind: 'invalid-recorded-at' }
  | { kind: 'invalid-reason-code' }
  | { kind: 'invalid-context' }
  | { kind: 'insufficient-funds'; balance: number; requestedDebit: number };

export type CoinDecisionOutcome =
  | { kind: 'applied'; ledger: CoinLedgerValue; transaction: CoinTransaction }
  | { kind: 'duplicate'; ledger: CoinLedgerValue; transaction: CoinTransaction };

const includes = <T extends string>(values: readonly T[], candidate: string): candidate is T =>
  (values as readonly string[]).includes(candidate);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const parseContext = (
  value: unknown
): Result<Record<string, string | number | boolean | null>, CoinDecisionError> => {
  if (value === undefined) {
    return { ok: true, value: {} };
  }
  if (!isRecord(value)) {
    return { ok: false, error: { kind: 'invalid-context' } };
  }
  const context: Record<string, string | number | boolean | null> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (
      typeof entry === 'string' ||
      typeof entry === 'number' ||
      typeof entry === 'boolean' ||
      entry === null
    ) {
      context[key] = entry;
    } else {
      return { ok: false, error: { kind: 'invalid-context' } };
    }
  }
  return { ok: true, value: context };
};

const parseTransactionId = (value: unknown): Result<string, CoinDecisionError> => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return { ok: false, error: { kind: 'invalid-transaction-id' } };
  }
  return { ok: true, value: value.trim() };
};

const parseWholeCoinAmount = (
  value: unknown,
  sign: 'positive' | 'negative'
): Result<number, CoinDecisionError> => {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    return { ok: false, error: { kind: 'invalid-amount' } };
  }
  return { ok: true, value: sign === 'positive' ? value : -value };
};

const parseRecordedAt = (value: unknown): Result<number, CoinDecisionError> => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return { ok: false, error: { kind: 'invalid-recorded-at' } };
  }
  return { ok: true, value };
};

const parseReasonCode = (value: unknown): Result<CoinReasonCode, CoinDecisionError> => {
  if (typeof value !== 'string' || !includes(COIN_REASON_CODES, value)) {
    return { ok: false, error: { kind: 'invalid-reason-code' } };
  }
  return { ok: true, value };
};

const findTransaction = (
  ledger: CoinLedgerValue,
  transactionId: string
): CoinTransaction | undefined => ledger.transactions.find((entry) => entry.id === transactionId);

export const applyCoinCommand = (
  current: CoinLedgerValue,
  command: CoinCommand
): Result<CoinDecisionOutcome, CoinDecisionError> => {
  const transactionId = parseTransactionId(command.transactionId);
  if (!transactionId.ok) {
    return transactionId;
  }
  const recordedAt = parseRecordedAt(command.recordedAt);
  if (!recordedAt.ok) {
    return recordedAt;
  }
  const reasonCode = parseReasonCode(command.reasonCode);
  if (!reasonCode.ok) {
    return reasonCode;
  }
  const context = parseContext(command.context);
  if (!context.ok) {
    return context;
  }

  const existing = findTransaction(current, transactionId.value);
  if (existing) {
    return {
      ok: true,
      value: { kind: 'duplicate', ledger: cloneCoinLedgerValue(current), transaction: existing },
    };
  }

  const amount =
    command.kind === 'credit'
      ? parseWholeCoinAmount(command.amount, 'positive')
      : parseWholeCoinAmount(command.amount, 'negative');
  if (!amount.ok) {
    return amount;
  }

  if (command.kind === 'debit' && current.balance + amount.value < 0) {
    return {
      ok: false,
      error: {
        kind: 'insufficient-funds',
        balance: current.balance,
        requestedDebit: Math.abs(amount.value),
      },
    };
  }

  const transaction = cloneCoinTransaction({
    id: transactionId.value,
    amount: amount.value,
    recordedAt: recordedAt.value,
    reasonCode: reasonCode.value,
    context: context.value,
  });

  const ledger = cloneCoinLedgerValue(current);
  ledger.transactions = [...ledger.transactions, transaction];
  ledger.balance += transaction.amount;

  return { ok: true, value: { kind: 'applied', ledger, transaction } };
};
