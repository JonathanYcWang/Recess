import type {
  TaskListCommandResponse,
  TaskListPublishedSnapshot,
  TaskListRuntimeResult,
} from '../taskListTypes';

export const TASK_LIST_RUNTIME_CHANNEL = 'recess.task-list.runtime.v1';
export const TASK_LIST_RUNTIME_PORT_NAME = 'recess.task-list.runtime.port.v1';

export type TaskListRuntimeRequest =
  | { channel: typeof TASK_LIST_RUNTIME_CHANNEL; action: 'current' }
  | { channel: typeof TASK_LIST_RUNTIME_CHANNEL; action: 'command'; envelope: unknown };

export type TaskListRuntimeTransportError =
  | { kind: 'missing-receiver' }
  | { kind: 'closed-channel' }
  | { kind: 'malformed-payload' }
  | { kind: 'extension-shutdown' }
  | { kind: 'transport-unavailable' };

export type TaskListRuntimeMessageResponse =
  | {
      channel: typeof TASK_LIST_RUNTIME_CHANNEL;
      ok: true;
      action: 'current';
      result: TaskListRuntimeResult;
    }
  | {
      channel: typeof TASK_LIST_RUNTIME_CHANNEL;
      ok: true;
      action: 'command';
      result: TaskListCommandResponse;
    }
  | {
      channel: typeof TASK_LIST_RUNTIME_CHANNEL;
      ok: false;
      error: TaskListRuntimeTransportError;
    };

export type TaskListRuntimePortMessage =
  | { channel: typeof TASK_LIST_RUNTIME_CHANNEL; action: 'subscribe' }
  | {
      channel: typeof TASK_LIST_RUNTIME_CHANNEL;
      action: 'snapshot';
      snapshot: TaskListPublishedSnapshot;
    };

export const isTaskListRuntimeRequest = (message: unknown): message is TaskListRuntimeRequest =>
  Boolean(
    message &&
    typeof message === 'object' &&
    'channel' in message &&
    (message as TaskListRuntimeRequest).channel === TASK_LIST_RUNTIME_CHANNEL &&
    'action' in message &&
    ((message as TaskListRuntimeRequest).action === 'current' ||
      (message as TaskListRuntimeRequest).action === 'command')
  );

export const isTaskListRuntimePortMessage = (
  message: unknown
): message is TaskListRuntimePortMessage =>
  Boolean(
    message &&
    typeof message === 'object' &&
    'channel' in message &&
    (message as TaskListRuntimePortMessage).channel === TASK_LIST_RUNTIME_CHANNEL &&
    'action' in message &&
    ((message as TaskListRuntimePortMessage).action === 'subscribe' ||
      (message as TaskListRuntimePortMessage).action === 'snapshot')
  );

export interface TaskListRuntimeMessagePort {
  postMessage(message: TaskListRuntimePortMessage): void;
  disconnect(): void;
  onMessage(listener: (message: TaskListRuntimePortMessage) => void): () => void;
  onDisconnect(listener: () => void): () => void;
}

export interface TaskListRuntimeMessageTransport {
  send(request: TaskListRuntimeRequest): Promise<TaskListRuntimeMessageResponse>;
  connect(): TaskListRuntimeMessagePort;
}
