import { createReducer } from '@reduxjs/toolkit';
import type { TaskProjection } from '@/modules/task-list';
import {
  setTaskListConnectionState,
  setTaskListProjection,
} from '../actions/taskListProjectionActions';

export type TaskListConnectionState = 'connecting' | 'connected' | 'disconnected';

export interface TaskListProjectionState {
  revision: number | null;
  incompleteTasks: TaskProjection[];
  completedTasks: TaskProjection[];
  connectionState: TaskListConnectionState;
}

const cloneTaskProjection = (task: TaskProjection): TaskProjection => ({ ...task });

const initialState: TaskListProjectionState = {
  revision: null,
  incompleteTasks: [],
  completedTasks: [],
  connectionState: 'connecting',
};

const taskListProjectionReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(setTaskListProjection, (state, action) => {
      state.revision = action.payload.revision;
      state.incompleteTasks = action.payload.incompleteTasks.map(cloneTaskProjection);
      state.completedTasks = action.payload.completedTasks.map(cloneTaskProjection);
      state.connectionState = 'connected';
    })
    .addCase(setTaskListConnectionState, (state, action) => {
      state.connectionState = action.payload;
    });
});

export default taskListProjectionReducer;
