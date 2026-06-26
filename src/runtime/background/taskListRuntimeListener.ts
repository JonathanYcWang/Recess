import {
  TASK_LIST_RUNTIME_CHANNEL,
  TASK_LIST_RUNTIME_PORT_NAME,
  isTaskListRuntimePortMessage,
  isTaskListRuntimeRequest,
} from '../messaging/taskListMessages';
import { createRuntimeListener } from './createRuntimeListener';

const taskListListener = createRuntimeListener({
  channel: TASK_LIST_RUNTIME_CHANNEL,
  portName: TASK_LIST_RUNTIME_PORT_NAME,
  isRequest: isTaskListRuntimeRequest,
  isPortMessage: isTaskListRuntimePortMessage,
  buildHandler: (root) => root.taskListHandler,
});

export const registerTaskListRuntimeListener = (
  options: Parameters<typeof taskListListener.register>[0]
): void => taskListListener.register(options);

export const resetTaskListRuntimeListenerForTests = (): void => taskListListener.resetForTests();
