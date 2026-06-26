import {
  WORKSTYLE_PROFILE_RUNTIME_CHANNEL,
  WORKSTYLE_PROFILE_RUNTIME_PORT_NAME,
  isWorkstyleProfileRuntimePortMessage,
  isWorkstyleProfileRuntimeRequest,
} from '../messaging/workstyleProfileMessages';
import { createRuntimeListener } from './createRuntimeListener';

const workstyleProfileListener = createRuntimeListener({
  channel: WORKSTYLE_PROFILE_RUNTIME_CHANNEL,
  portName: WORKSTYLE_PROFILE_RUNTIME_PORT_NAME,
  isRequest: isWorkstyleProfileRuntimeRequest,
  isPortMessage: isWorkstyleProfileRuntimePortMessage,
  buildHandler: (root) => root.workstyleProfileHandler,
});

export const registerWorkstyleProfileRuntimeListener = (
  options: Parameters<typeof workstyleProfileListener.register>[0]
): void => workstyleProfileListener.register(options);

export const resetWorkstyleProfileRuntimeListenerForTests = (): void =>
  workstyleProfileListener.resetForTests();
