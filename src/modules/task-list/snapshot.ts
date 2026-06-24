import { deriveRemainingWorkSeconds } from './timeEstimate';
import type { Task, TaskListValue } from './taskListDocument';

export interface TaskProjection {
  id: string;
  title: string;
  status: Task['status'];
  originalEstimateMinutes: number;
  focusedTimeSeconds: number;
  remainingWorkSeconds: number;
  completedAtEpochMs?: number;
}

export interface TaskListSnapshot {
  incompleteTasks: TaskProjection[];
  completedTasks: TaskProjection[];
}

const projectTask = (task: Task): TaskProjection => ({
  id: task.id,
  title: task.title,
  status: task.status,
  originalEstimateMinutes: task.originalEstimateMinutes,
  focusedTimeSeconds: task.focusedTimeSeconds,
  remainingWorkSeconds: deriveRemainingWorkSeconds(task),
  completedAtEpochMs: task.completedAtEpochMs,
});

export const projectTaskListSnapshot = (value: TaskListValue): TaskListSnapshot => ({
  incompleteTasks: value.tasks.filter((task) => task.status !== 'completed').map(projectTask),
  completedTasks: value.tasks.filter((task) => task.status === 'completed').map(projectTask),
});
