import {
  BLOCK_LIST_RUNTIME_CHANNEL,
  BLOCK_LIST_RUNTIME_PORT_NAME,
  type BlockListRuntimeMessageResponse,
  type BlockListRuntimeMessageTransport,
  type BlockListRuntimePortMessage,
  type BlockListRuntimeRequest,
} from './blockListMessages';
import type { ExtensionRuntimeApi } from './extensionRuntimeApi';
import {
  createExtensionRuntimeTransport,
  createSafariCompatibleRuntimeTransport,
} from './extensionRuntimeTransport';

const blockListRuntimeTransportConfig = {
  channel: BLOCK_LIST_RUNTIME_CHANNEL,
  portName: BLOCK_LIST_RUNTIME_PORT_NAME,
};

export const createBlockListExtensionRuntimeTransport = (
  runtime: ExtensionRuntimeApi
): BlockListRuntimeMessageTransport =>
  createExtensionRuntimeTransport<
    BlockListRuntimeRequest,
    BlockListRuntimeMessageResponse,
    BlockListRuntimePortMessage
  >(runtime, blockListRuntimeTransportConfig);

export const createBlockListSafariCompatibleRuntimeTransport =
  (): BlockListRuntimeMessageTransport | null =>
    createSafariCompatibleRuntimeTransport<
      BlockListRuntimeRequest,
      BlockListRuntimeMessageResponse,
      BlockListRuntimePortMessage
    >(blockListRuntimeTransportConfig);
