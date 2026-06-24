import type { RootState } from '../index';

export const selectTaskListIncompleteTasks = (state: RootState) =>
  state.taskListProjection.incompleteTasks;

export const selectTaskListCompletedTasks = (state: RootState) =>
  state.taskListProjection.completedTasks;

export const selectTaskListRevision = (state: RootState): number | null =>
  state.taskListProjection.revision;

export const selectTaskListConnectionState = (state: RootState) =>
  state.taskListProjection.connectionState;

export const selectIsTaskListDisconnected = (state: RootState): boolean =>
  state.taskListProjection.connectionState === 'disconnected';
