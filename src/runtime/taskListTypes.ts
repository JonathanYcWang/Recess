import type { TaskListSnapshot, TaskListValue } from '@/modules/task-list';
import type { VersionedDocument } from '@/runtime/persistence';
import type { TaskListCommandEnvelope, TaskListCommandError } from './protocol/taskListCommand';
import type { TaskListRuntimeTransportError } from './messaging/taskListMessages';
import type { RuntimeCommandResponse } from './protocol/types';

export type TaskListPublishedSnapshot = {
  revision: number;
  snapshot: TaskListSnapshot;
};

export type TaskListCommandResponse = RuntimeCommandResponse<
  TaskListPublishedSnapshot,
  TaskListCommandError
>;

export type TaskListClientError = TaskListCommandError | TaskListRuntimeTransportError;

export type TaskListClientCommandResult = RuntimeCommandResponse<
  TaskListPublishedSnapshot,
  TaskListClientError
>;

export type TaskListClientCurrentResult =
  | TaskListRuntimeResult
  | { ok: false; error: TaskListRuntimeTransportError };

export type TaskListRuntimeError = TaskListCommandError;

export type TaskListRuntimeResult =
  | { ok: true; value: TaskListPublishedSnapshot }
  | { ok: false; error: TaskListRuntimeError };

export interface TaskListSubscribeOptions {
  onTransportLoss?: () => void;
}

export interface TaskListCommandHandler {
  current(): TaskListRuntimeResult;
  getDocument(): VersionedDocument<TaskListValue>;
  adoptCommitted(document: VersionedDocument<TaskListValue>): void;
  execute(envelope: unknown): Promise<TaskListCommandResponse>;
  subscribe(listener: (snapshot: TaskListPublishedSnapshot) => void): () => void;
}

export interface TaskListClient {
  current(): Promise<TaskListClientCurrentResult>;
  command(envelope: TaskListCommandEnvelope): Promise<TaskListClientCommandResult>;
  createTask(
    input: { title: string; originalEstimateMinutes: number },
    options?: { commandId?: string; expectedRevision?: number }
  ): Promise<TaskListClientCommandResult>;
  updateTitle(
    taskId: string,
    title: string,
    options?: { commandId?: string; expectedRevision?: number }
  ): Promise<TaskListClientCommandResult>;
  reorderTasks(
    orderedTaskIds: string[],
    options?: { commandId?: string; expectedRevision?: number }
  ): Promise<TaskListClientCommandResult>;
  completeTask(
    taskId: string,
    options?: { commandId?: string; expectedRevision?: number }
  ): Promise<TaskListClientCommandResult>;
  deleteTask(
    taskId: string,
    options?: { commandId?: string; expectedRevision?: number }
  ): Promise<TaskListClientCommandResult>;
  subscribe(
    listener: (snapshot: TaskListPublishedSnapshot) => void,
    options?: TaskListSubscribeOptions
  ): () => void;
}
