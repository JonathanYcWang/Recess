import {
  WORK_START_REMINDER_RUNTIME_CHANNEL,
  WORK_START_REMINDER_RUNTIME_PORT_NAME,
  isWorkStartReminderRuntimePortMessage,
  isWorkStartReminderRuntimeRequest,
} from '../messaging/workStartReminderMessages';
import { createRuntimeListener } from './createRuntimeListener';

const workStartReminderListener = createRuntimeListener({
  channel: WORK_START_REMINDER_RUNTIME_CHANNEL,
  portName: WORK_START_REMINDER_RUNTIME_PORT_NAME,
  isRequest: isWorkStartReminderRuntimeRequest,
  isPortMessage: isWorkStartReminderRuntimePortMessage,
  buildHandler: (root) => root.workStartReminderHandler,
});

export const registerWorkStartReminderRuntimeListener = (
  options: Parameters<typeof workStartReminderListener.register>[0]
): void => workStartReminderListener.register(options);

export const resetWorkStartReminderRuntimeListenerForTests = (): void =>
  workStartReminderListener.resetForTests();
