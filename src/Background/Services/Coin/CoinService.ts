type CoinDecisionError = 'coin-amount-invalid' | 'coin-balance-insufficient';

export const createDefaultCoinBalanceValue = (): number => 0;

export const addCoins = (value: number, amount: number): number =>
  value + Math.max(0, Math.floor(amount));

export const setCoinBalance = (_value: number, balance: number): number =>
  Math.max(0, Math.floor(balance));

export const awardCompletedFocusCoin = (value: number): number => addCoins(value, 1);

export const spendCoins = (
  value: number,
  amount: number
): { ok: true; value: number } | { ok: false; error: CoinDecisionError } => {
  const wholeAmount = Math.floor(amount);

  if (wholeAmount <= 0) {
    return { ok: false, error: 'coin-amount-invalid' };
  }

  if (value < wholeAmount) {
    return { ok: false, error: 'coin-balance-insufficient' };
  }

  return { ok: true, value: value - wholeAmount };
};
