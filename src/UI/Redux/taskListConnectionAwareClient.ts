import type { TaskListClient, TaskListClientCommandResult } from '@/runtime/taskListTypes';
import {
  getTaskListConnectionManager,
  isTaskListTransportError,
} from './taskListConnectionManager';

const transportUnavailable = (): TaskListClientCommandResult => ({
  ok: false,
  error: { kind: 'transport-unavailable' },
});

export const createConnectionAwareTaskListClient = (client: TaskListClient): TaskListClient => {
  const guard = async <T extends TaskListClientCommandResult>(
    action: () => Promise<T>
  ): Promise<T> => {
    const manager = getTaskListConnectionManager();
    if (manager?.getConnectionState() === 'disconnected') {
      return transportUnavailable() as T;
    }
    const result = await action();
    if (!result.ok && isTaskListTransportError(result.error)) {
      manager?.markDisconnected();
    }
    return result;
  };

  return {
    current: () => client.current(),
    subscribe: (listener, options) => client.subscribe(listener, options),
    command: (envelope) => guard(() => client.command(envelope)),
    createTask: (input, options) => guard(() => client.createTask(input, options)),
    updateTitle: (taskId, title, options) =>
      guard(() => client.updateTitle(taskId, title, options)),
    reorderTasks: (orderedTaskIds, options) =>
      guard(() => client.reorderTasks(orderedTaskIds, options)),
    completeTask: (taskId, options) => guard(() => client.completeTask(taskId, options)),
    deleteTask: (taskId, options) => guard(() => client.deleteTask(taskId, options)),
  };
};
