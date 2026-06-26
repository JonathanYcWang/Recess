import {
  TASK_LIST_RUNTIME_CHANNEL,
  TASK_LIST_RUNTIME_PORT_NAME,
  type TaskListRuntimeMessageResponse,
  type TaskListRuntimeMessageTransport,
  type TaskListRuntimePortMessage,
  type TaskListRuntimeRequest,
} from './taskListMessages';
import type { ExtensionRuntimeApi } from './extensionRuntimeApi';
import {
  createExtensionRuntimeTransport,
  createSafariCompatibleRuntimeTransport,
} from './extensionRuntimeTransport';

const taskListRuntimeTransportConfig = {
  channel: TASK_LIST_RUNTIME_CHANNEL,
  portName: TASK_LIST_RUNTIME_PORT_NAME,
};

export const createTaskListExtensionRuntimeTransport = (
  runtime: ExtensionRuntimeApi
): TaskListRuntimeMessageTransport =>
  createExtensionRuntimeTransport<
    TaskListRuntimeRequest,
    TaskListRuntimeMessageResponse,
    TaskListRuntimePortMessage
  >(runtime, taskListRuntimeTransportConfig);

export const createTaskListSafariCompatibleRuntimeTransport =
  (): TaskListRuntimeMessageTransport | null =>
    createSafariCompatibleRuntimeTransport<
      TaskListRuntimeRequest,
      TaskListRuntimeMessageResponse,
      TaskListRuntimePortMessage
    >(taskListRuntimeTransportConfig);
