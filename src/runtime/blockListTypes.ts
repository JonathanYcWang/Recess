import type { VersionedDocument } from '@/modules/persisted-application-state';
import type { BlockListValue } from '@/modules/block-list';
import type { BlockListCommandEnvelope, BlockListCommandError } from './protocol/blockListCommand';
import type { BlockListRuntimeTransportError } from './messaging/blockListMessages';
import type { RuntimeCommandResponse } from './protocol/types';

export type BlockListSnapshot = VersionedDocument<BlockListValue>;

export type BlockListCommandResponse = RuntimeCommandResponse<
  BlockListSnapshot,
  BlockListCommandError
>;

export type BlockListClientError = BlockListCommandError | BlockListRuntimeTransportError;

export type BlockListClientCommandResult = RuntimeCommandResponse<
  BlockListSnapshot,
  BlockListClientError
>;

export type BlockListClientCurrentResult =
  | BlockListRuntimeResult
  | { ok: false; error: BlockListRuntimeTransportError };

export type BlockListRuntimeError = BlockListCommandError;

export type BlockListRuntimeResult =
  | { ok: true; value: BlockListSnapshot }
  | { ok: false; error: BlockListRuntimeError };

export interface BlockListSubscribeOptions {
  onTransportLoss?: () => void;
}

export interface BlockListCommandHandler {
  current(): BlockListRuntimeResult;
  execute(envelope: unknown): Promise<BlockListCommandResponse>;
  subscribe(listener: (snapshot: BlockListSnapshot) => void): () => void;
}

export interface BlockListClient {
  current(): Promise<BlockListClientCurrentResult>;
  command(envelope: BlockListCommandEnvelope): Promise<BlockListClientCommandResult>;
  addEntry(
    input: string,
    options?: { commandId?: string; expectedRevision?: number }
  ): Promise<BlockListClientCommandResult>;
  removeEntry(
    hostname: string,
    options?: { commandId?: string; expectedRevision?: number }
  ): Promise<BlockListClientCommandResult>;
  subscribe(
    listener: (snapshot: BlockListSnapshot) => void,
    options?: BlockListSubscribeOptions
  ): () => void;
}
