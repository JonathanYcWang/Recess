import type { VersionedDocument } from '@/runtime/persistence';
import type { CoinLedgerValue } from '@/modules/coin';
import type { CoinCommandEnvelope, CoinCommandError } from './protocol/coinCommand';
import type { RuntimeCommandResponse } from './protocol/types';

export type CoinSnapshot = VersionedDocument<CoinLedgerValue>;

export type CoinCommandResponse = RuntimeCommandResponse<CoinSnapshot, CoinCommandError>;

export type CoinRuntimeResult =
  | { ok: true; value: CoinSnapshot }
  | { ok: false; error: CoinCommandError };

export interface CoinCommandHandler {
  current(): CoinRuntimeResult;
  execute(envelope: unknown): Promise<CoinCommandResponse>;
  subscribe(listener: (snapshot: CoinSnapshot) => void): () => void;
}

export interface CoinClient {
  current(): Promise<CoinRuntimeResult>;
  command(envelope: CoinCommandEnvelope): Promise<CoinCommandResponse>;
  subscribe(listener: (snapshot: CoinSnapshot) => void): () => void;
}
