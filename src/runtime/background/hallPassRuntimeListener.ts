import {
  HALL_PASS_RUNTIME_CHANNEL,
  HALL_PASS_RUNTIME_PORT_NAME,
  isHallPassRuntimePortMessage,
  isHallPassRuntimeRequest,
} from '../messaging/hallPassMessages';
import { createRuntimeListener } from './createRuntimeListener';

const hallPassListener = createRuntimeListener({
  channel: HALL_PASS_RUNTIME_CHANNEL,
  portName: HALL_PASS_RUNTIME_PORT_NAME,
  isRequest: isHallPassRuntimeRequest,
  isPortMessage: isHallPassRuntimePortMessage,
  buildHandler: (root) => root.hallPassHandler,
});

export const registerHallPassRuntimeListener = (
  options: Parameters<typeof hallPassListener.register>[0]
): void => hallPassListener.register(options);

export const resetHallPassRuntimeListenerForTests = (): void => hallPassListener.resetForTests();
