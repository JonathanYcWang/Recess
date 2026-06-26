import {
  WORK_START_REMINDER_RUNTIME_CHANNEL,
  WORK_START_REMINDER_RUNTIME_PORT_NAME,
  type WorkStartReminderRuntimeMessageResponse,
  type WorkStartReminderRuntimeMessageTransport,
  type WorkStartReminderRuntimePortMessage,
  type WorkStartReminderRuntimeRequest,
} from './workStartReminderMessages';
import type { ExtensionRuntimeApi } from './extensionRuntimeApi';
import {
  createExtensionRuntimeTransport,
  createSafariCompatibleRuntimeTransport,
} from './extensionRuntimeTransport';

const workStartReminderRuntimeTransportConfig = {
  channel: WORK_START_REMINDER_RUNTIME_CHANNEL,
  portName: WORK_START_REMINDER_RUNTIME_PORT_NAME,
};

export const createWorkStartReminderExtensionRuntimeTransport = (
  runtime: ExtensionRuntimeApi
): WorkStartReminderRuntimeMessageTransport =>
  createExtensionRuntimeTransport<
    WorkStartReminderRuntimeRequest,
    WorkStartReminderRuntimeMessageResponse,
    WorkStartReminderRuntimePortMessage
  >(runtime, workStartReminderRuntimeTransportConfig);

export const createWorkStartReminderSafariCompatibleRuntimeTransport =
  (): WorkStartReminderRuntimeMessageTransport | null =>
    createSafariCompatibleRuntimeTransport<
      WorkStartReminderRuntimeRequest,
      WorkStartReminderRuntimeMessageResponse,
      WorkStartReminderRuntimePortMessage
    >(workStartReminderRuntimeTransportConfig);
