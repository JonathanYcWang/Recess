export const COIN_REASON_CODES = [
  'standard-focus',
  'extension-focus',
  'hall-pass',
  'work-session-streak',
  'focus-block-streak',
  'paid-reroll',
  'mood-boost',
] as const;

export type CoinReasonCode = (typeof COIN_REASON_CODES)[number];

export interface CoinTransaction {
  id: string;
  amount: number;
  recordedAt: number;
  reasonCode: CoinReasonCode;
  context: Record<string, string | number | boolean | null>;
}

export interface CoinLedgerValue {
  balance: number;
  transactions: CoinTransaction[];
}

export const createDefaultCoinLedgerValue = (): CoinLedgerValue => ({
  balance: 0,
  transactions: [],
});

export const cloneCoinTransaction = (transaction: CoinTransaction): CoinTransaction => ({
  id: transaction.id,
  amount: transaction.amount,
  recordedAt: transaction.recordedAt,
  reasonCode: transaction.reasonCode,
  context: { ...transaction.context },
});

export const cloneCoinLedgerValue = (value: CoinLedgerValue): CoinLedgerValue => ({
  balance: value.balance,
  transactions: value.transactions.map(cloneCoinTransaction),
});
