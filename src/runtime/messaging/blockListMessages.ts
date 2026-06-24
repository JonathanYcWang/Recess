import type {
  BlockListCommandResponse,
  BlockListRuntimeResult,
  BlockListSnapshot,
} from '../blockListTypes';

export const BLOCK_LIST_RUNTIME_CHANNEL = 'recess.block-list.runtime.v1';
export const BLOCK_LIST_RUNTIME_PORT_NAME = 'recess.block-list.runtime.port.v1';

export type BlockListRuntimeRequest =
  | { channel: typeof BLOCK_LIST_RUNTIME_CHANNEL; action: 'current' }
  | { channel: typeof BLOCK_LIST_RUNTIME_CHANNEL; action: 'command'; envelope: unknown };

export type BlockListRuntimeTransportError =
  | { kind: 'missing-receiver' }
  | { kind: 'closed-channel' }
  | { kind: 'malformed-payload' }
  | { kind: 'extension-shutdown' }
  | { kind: 'transport-unavailable' };

export type BlockListRuntimeMessageResponse =
  | {
      channel: typeof BLOCK_LIST_RUNTIME_CHANNEL;
      ok: true;
      action: 'current';
      result: BlockListRuntimeResult;
    }
  | {
      channel: typeof BLOCK_LIST_RUNTIME_CHANNEL;
      ok: true;
      action: 'command';
      result: BlockListCommandResponse;
    }
  | {
      channel: typeof BLOCK_LIST_RUNTIME_CHANNEL;
      ok: false;
      error: BlockListRuntimeTransportError;
    };

export type BlockListRuntimePortMessage =
  | { channel: typeof BLOCK_LIST_RUNTIME_CHANNEL; action: 'subscribe' }
  | { channel: typeof BLOCK_LIST_RUNTIME_CHANNEL; action: 'snapshot'; snapshot: BlockListSnapshot };

export const isBlockListRuntimeRequest = (message: unknown): message is BlockListRuntimeRequest =>
  Boolean(
    message &&
    typeof message === 'object' &&
    'channel' in message &&
    (message as BlockListRuntimeRequest).channel === BLOCK_LIST_RUNTIME_CHANNEL &&
    'action' in message &&
    ((message as BlockListRuntimeRequest).action === 'current' ||
      (message as BlockListRuntimeRequest).action === 'command')
  );

export const isBlockListRuntimePortMessage = (
  message: unknown
): message is BlockListRuntimePortMessage =>
  Boolean(
    message &&
    typeof message === 'object' &&
    'channel' in message &&
    (message as BlockListRuntimePortMessage).channel === BLOCK_LIST_RUNTIME_CHANNEL &&
    'action' in message &&
    ((message as BlockListRuntimePortMessage).action === 'subscribe' ||
      (message as BlockListRuntimePortMessage).action === 'snapshot')
  );

export interface BlockListRuntimeMessagePort {
  postMessage(message: BlockListRuntimePortMessage): void;
  disconnect(): void;
  onMessage(listener: (message: BlockListRuntimePortMessage) => void): () => void;
  onDisconnect(listener: () => void): () => void;
}

export interface BlockListRuntimeMessageTransport {
  send(request: BlockListRuntimeRequest): Promise<BlockListRuntimeMessageResponse>;
  connect(): BlockListRuntimeMessagePort;
}
