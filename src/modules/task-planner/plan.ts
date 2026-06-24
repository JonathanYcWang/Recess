import type { TaskProjection } from '@/modules/task-list';

export interface PlanTasksForFocusInput {
  incompleteTasks: TaskProjection[];
  scheduledFocusSeconds: number;
}

export interface PlanTasksForFocusResult {
  proposedTaskIds: string[];
  totalDerivedRemainingSeconds: number;
}

export const planTasksForFocus = (input: PlanTasksForFocusInput): PlanTasksForFocusResult => {
  const { incompleteTasks, scheduledFocusSeconds } = input;

  if (scheduledFocusSeconds <= 0 || incompleteTasks.length === 0) {
    return { proposedTaskIds: [], totalDerivedRemainingSeconds: 0 };
  }

  const proposedTaskIds: string[] = [];
  let totalDerivedRemainingSeconds = 0;

  for (const task of incompleteTasks) {
    proposedTaskIds.push(task.id);
    if (task.remainingWorkSeconds > 0) {
      totalDerivedRemainingSeconds += task.remainingWorkSeconds;
      if (totalDerivedRemainingSeconds >= scheduledFocusSeconds) {
        break;
      }
    }
  }

  return { proposedTaskIds, totalDerivedRemainingSeconds };
};

export const sortTaskIdsByManualOrder = (
  taskIds: string[],
  incompleteTasks: TaskProjection[]
): string[] => {
  const order = new Map(incompleteTasks.map((task, index) => [task.id, index]));
  return [...taskIds].sort((left, right) => (order.get(left) ?? 0) - (order.get(right) ?? 0));
};
