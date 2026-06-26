import {
  SETTINGS_RUNTIME_CHANNEL,
  SETTINGS_RUNTIME_PORT_NAME,
  isSettingsRuntimePortMessage,
  isSettingsRuntimeRequest,
} from '../messaging/messages';
import { createRuntimeListener } from './createRuntimeListener';

const settingsListener = createRuntimeListener({
  channel: SETTINGS_RUNTIME_CHANNEL,
  portName: SETTINGS_RUNTIME_PORT_NAME,
  isRequest: isSettingsRuntimeRequest,
  isPortMessage: isSettingsRuntimePortMessage,
  buildHandler: (root) => root.settingsHandler,
});

export const registerSettingsRuntimeListener = (
  options: Parameters<typeof settingsListener.register>[0]
): void => settingsListener.register(options);

export const resetSettingsRuntimeListenerForTests = (): void => settingsListener.resetForTests();
