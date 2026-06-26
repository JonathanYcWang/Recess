import {
  BLOCK_LIST_RUNTIME_CHANNEL,
  BLOCK_LIST_RUNTIME_PORT_NAME,
  isBlockListRuntimePortMessage,
  isBlockListRuntimeRequest,
} from '../messaging/blockListMessages';
import { createRuntimeListener } from './createRuntimeListener';

const blockListListener = createRuntimeListener({
  channel: BLOCK_LIST_RUNTIME_CHANNEL,
  portName: BLOCK_LIST_RUNTIME_PORT_NAME,
  isRequest: isBlockListRuntimeRequest,
  isPortMessage: isBlockListRuntimePortMessage,
  buildHandler: (root) => root.blockListHandler,
});

export const registerBlockListRuntimeListener = (
  options: Parameters<typeof blockListListener.register>[0]
): void => blockListListener.register(options);

export const resetBlockListRuntimeListenerForTests = (): void => blockListListener.resetForTests();
