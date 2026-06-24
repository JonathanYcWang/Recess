export type TaskStatus = 'to-do' | 'in-progress' | 'completed';

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  originalEstimateMinutes: number;
  focusedTimeSeconds: number;
  createdAtEpochMs: number;
  updatedAtEpochMs: number;
  completedAtEpochMs?: number;
}

export interface TaskListValue {
  tasks: Task[];
}

export const createDefaultTaskListValue = (): TaskListValue => ({
  tasks: [],
});

export const cloneTask = (task: Task): Task => ({ ...task });

export const cloneTaskListValue = (value: TaskListValue): TaskListValue => ({
  tasks: value.tasks.map(cloneTask),
});

export const isIncompleteTask = (task: Task): boolean => task.status !== 'completed';
