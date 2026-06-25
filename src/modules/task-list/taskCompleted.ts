import type { WorkHistoryFact } from '@/modules/work-history';
import { withSchemaVersion } from '@/modules/work-history/factCodec';

export interface TaskCompletedContext {
  factId: string;
  recordedAt: number;
  taskId: string;
  workSessionId: string;
  originalEstimateMinutes: number;
  totalFocusedTimeSeconds: number;
  completedAtEpochMs: number;
}

export const taskCompletedFactId = (taskId: string): string => `task-completed-${taskId}`;

export const createTaskCompletedFact = (context: TaskCompletedContext): WorkHistoryFact =>
  withSchemaVersion({
    id: context.factId,
    recordedAt: context.recordedAt,
    kind: 'task-completed',
    payload: {
      taskId: context.taskId,
      workSessionId: context.workSessionId,
      originalEstimateMinutes: context.originalEstimateMinutes,
      totalFocusedTimeSeconds: context.totalFocusedTimeSeconds,
      completedAtEpochMs: context.completedAtEpochMs,
    },
  });
