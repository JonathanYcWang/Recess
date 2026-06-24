import type { CoinClient, CoinCommandHandler } from '../coinTypes';

export const createInProcessCoinClient = (handler: CoinCommandHandler): CoinClient => ({
  current: async () => handler.current(),
  command: async (envelope) => handler.execute(envelope),
  subscribe: (listener) => handler.subscribe(listener),
});
