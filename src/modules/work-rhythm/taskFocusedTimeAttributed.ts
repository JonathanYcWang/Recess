import type { WorkHistoryFact } from '@/modules/work-history';
import { withSchemaVersion } from '@/modules/work-history/factCodec';

export interface TaskFocusedTimeAttributedContext {
  factId: string;
  recordedAt: number;
  workSessionId: string;
  taskId: string;
  seconds: number;
  attributedAt: number;
  focusBlockIndex: number;
  intervalStartedAt: number;
  intervalEndedAt: number;
}

export const taskFocusedTimeAttributedFactId = (
  workSessionId: string,
  taskId: string,
  intervalStartedAt: number,
  intervalEndedAt: number
): string => `task-focused-time-${workSessionId}-${taskId}-${intervalStartedAt}-${intervalEndedAt}`;

export const createTaskFocusedTimeAttributedFact = (
  context: TaskFocusedTimeAttributedContext
): WorkHistoryFact =>
  withSchemaVersion({
    id: context.factId,
    recordedAt: context.recordedAt,
    kind: 'task-focused-time-attributed',
    payload: {
      workSessionId: context.workSessionId,
      taskId: context.taskId,
      seconds: context.seconds,
      attributedAt: context.attributedAt,
      focusBlockIndex: context.focusBlockIndex,
      intervalStartedAt: context.intervalStartedAt,
      intervalEndedAt: context.intervalEndedAt,
    },
  });
