import type { WorkHistoryFact } from '@/modules/work-history';
import { withSchemaVersion, workHistoryFactToEffectFacts } from '@/modules/work-history/factCodec';

export interface FocusBlockCompletedContext {
  factId: string;
  recordedAt: number;
  workSessionId: string;
  focusBlockIndex: number;
  plannedFocusMinutes: number;
  actualFocusSeconds: number;
  completedAt: number;
  energyAtStart: string;
  wasExtension: boolean;
  completed?: boolean;
}

export const createFocusBlockCompletedFact = (
  context: FocusBlockCompletedContext
): WorkHistoryFact =>
  withSchemaVersion({
    id: context.factId,
    recordedAt: context.recordedAt,
    kind: 'focus-block-completed',
    payload: {
      workSessionId: context.workSessionId,
      focusBlockIndex: context.focusBlockIndex,
      plannedFocusMinutes: context.plannedFocusMinutes,
      actualFocusSeconds: context.actualFocusSeconds,
      completedAt: context.completedAt,
      energyAtStart: context.energyAtStart,
      wasExtension: context.wasExtension,
      completed: context.completed ?? true,
    },
  });

export const focusBlockCompletedFactsToEffectFacts = workHistoryFactToEffectFacts;
