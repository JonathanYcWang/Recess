import type { WorkHistoryFact } from '@/modules/work-history';

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
): WorkHistoryFact => ({
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

export const focusBlockCompletedFactsToEffectFacts = (
  fact: WorkHistoryFact
): Record<string, string> => {
  const facts: Record<string, string> = {
    factId: fact.id,
    recordedAt: String(fact.recordedAt),
    kind: fact.kind,
  };
  for (const [key, value] of Object.entries(fact.payload)) {
    if (value === null) {
      facts[key] = 'null';
    } else {
      facts[key] = String(value);
    }
  }
  return facts;
};
