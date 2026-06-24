import { createAction } from '@reduxjs/toolkit';
import type { TaskProjection } from '@/modules/task-list';
import type { TaskListConnectionState } from '../reducers/taskListProjectionReducer';

export const setTaskListProjection = createAction<{
  revision: number;
  incompleteTasks: TaskProjection[];
  completedTasks: TaskProjection[];
}>('taskListProjection/setProjection');

export const setTaskListConnectionState = createAction<TaskListConnectionState>(
  'taskListProjection/setConnectionState'
);
