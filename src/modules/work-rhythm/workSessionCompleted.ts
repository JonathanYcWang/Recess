import type { WorkHistoryFact } from '@/modules/work-history';
import { withSchemaVersion, workHistoryFactToEffectFacts } from '@/modules/work-history/factCodec';

export interface WorkSessionCompletedContext {
  factId: string;
  recordedAt: number;
  workSessionId: string;
  originalGoalSeconds: number;
  actualWorkedSeconds: number;
  completedAt: number;
  originalGoalPermanentlyComplete: boolean;
}

export const createWorkSessionCompletedFact = (
  context: WorkSessionCompletedContext
): WorkHistoryFact =>
  withSchemaVersion({
    id: context.factId,
    recordedAt: context.recordedAt,
    kind: 'work-session-completed',
    payload: {
      workSessionId: context.workSessionId,
      originalGoalSeconds: context.originalGoalSeconds,
      actualWorkedSeconds: context.actualWorkedSeconds,
      completedAt: context.completedAt,
      originalGoalPermanentlyComplete: context.originalGoalPermanentlyComplete,
    },
  });

export const workSessionCompletedFactsToEffectFacts = workHistoryFactToEffectFacts;
