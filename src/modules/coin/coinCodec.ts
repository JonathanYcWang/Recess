import type {
  DocumentCodec,
  Result,
  VersionedDocument,
} from '@/modules/persisted-application-state';
import {
  cloneCoinLedgerValue,
  COIN_REASON_CODES,
  createDefaultCoinLedgerValue,
  type CoinLedgerValue,
  type CoinReasonCode,
  type CoinTransaction,
} from './coinDocument';

export const COIN_LEDGER_SCHEMA_VERSION = 1;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const includes = <T extends string>(values: readonly T[], candidate: string): candidate is T =>
  (values as readonly string[]).includes(candidate);

const parseTransaction = (value: unknown): Result<CoinTransaction, string> => {
  if (!isRecord(value)) {
    return { ok: false, error: 'transaction must be an object' };
  }
  if (typeof value.id !== 'string' || value.id.length === 0) {
    return { ok: false, error: 'transaction id must be a non-empty string' };
  }
  if (typeof value.amount !== 'number' || !Number.isInteger(value.amount) || value.amount === 0) {
    return { ok: false, error: 'transaction amount must be a non-zero integer' };
  }
  if (typeof value.recordedAt !== 'number' || !Number.isFinite(value.recordedAt)) {
    return { ok: false, error: 'transaction recordedAt must be a finite number' };
  }
  if (typeof value.reasonCode !== 'string' || !includes(COIN_REASON_CODES, value.reasonCode)) {
    return { ok: false, error: 'transaction reasonCode must be an approved reason code' };
  }
  if (!isRecord(value.context)) {
    return { ok: false, error: 'transaction context must be an object' };
  }
  const context: Record<string, string | number | boolean | null> = {};
  for (const [key, entry] of Object.entries(value.context)) {
    if (
      typeof entry === 'string' ||
      typeof entry === 'number' ||
      typeof entry === 'boolean' ||
      entry === null
    ) {
      context[key] = entry;
    } else {
      return { ok: false, error: 'transaction context values must be primitive' };
    }
  }
  return {
    ok: true,
    value: {
      id: value.id,
      amount: value.amount,
      recordedAt: value.recordedAt,
      reasonCode: value.reasonCode as CoinReasonCode,
      context,
    },
  };
};

const parseCoinLedgerValue = (value: unknown): Result<CoinLedgerValue, string> => {
  if (!isRecord(value)) {
    return { ok: false, error: 'coin ledger value must be an object' };
  }
  if (typeof value.balance !== 'number' || !Number.isInteger(value.balance)) {
    return { ok: false, error: 'balance must be an integer' };
  }
  if (!Array.isArray(value.transactions)) {
    return { ok: false, error: 'transactions must be an array' };
  }
  const transactions: CoinTransaction[] = [];
  for (const entry of value.transactions) {
    const parsed = parseTransaction(entry);
    if (!parsed.ok) {
      return { ok: false, error: parsed.error };
    }
    transactions.push(parsed.value);
  }
  const computedBalance = transactions.reduce((sum, entry) => sum + entry.amount, 0);
  if (computedBalance !== value.balance) {
    return { ok: false, error: 'balance must match transaction sum' };
  }
  return { ok: true, value: { balance: value.balance, transactions } };
};

export const coinCodec: DocumentCodec<CoinLedgerValue> = {
  schemaVersion: COIN_LEDGER_SCHEMA_VERSION,

  createDefault(): VersionedDocument<CoinLedgerValue> {
    return {
      schemaVersion: COIN_LEDGER_SCHEMA_VERSION,
      revision: 0,
      value: createDefaultCoinLedgerValue(),
    };
  },

  encode(document: VersionedDocument<CoinLedgerValue>): unknown {
    return {
      schemaVersion: document.schemaVersion,
      revision: document.revision,
      value: cloneCoinLedgerValue(document.value),
    };
  },

  decode(wire: unknown) {
    if (!isRecord(wire)) {
      return {
        ok: false as const,
        error: {
          kind: 'invalid-document' as const,
          message: 'Coin ledger document must be an object',
        },
      };
    }
    if (typeof wire.schemaVersion !== 'number') {
      return {
        ok: false as const,
        error: {
          kind: 'invalid-field' as const,
          field: 'schemaVersion',
          message: 'schemaVersion must be a number',
        },
      };
    }
    if (wire.schemaVersion !== COIN_LEDGER_SCHEMA_VERSION) {
      return {
        ok: false as const,
        error: {
          kind: 'unsupported-version' as const,
          message: `Unsupported Coin ledger schema version ${wire.schemaVersion}`,
        },
      };
    }
    if (
      typeof wire.revision !== 'number' ||
      !Number.isInteger(wire.revision) ||
      wire.revision < 0
    ) {
      return {
        ok: false as const,
        error: {
          kind: 'invalid-field' as const,
          field: 'revision',
          message: 'revision must be a non-negative integer',
        },
      };
    }
    const value = parseCoinLedgerValue(wire.value);
    if (!value.ok) {
      return {
        ok: false as const,
        error: {
          kind: 'invalid-field' as const,
          field: 'value',
          message: value.error,
        },
      };
    }
    return {
      ok: true as const,
      value: {
        schemaVersion: wire.schemaVersion,
        revision: wire.revision,
        value: value.value,
      },
    };
  },
};
