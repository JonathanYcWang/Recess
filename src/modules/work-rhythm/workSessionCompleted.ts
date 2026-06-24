import type { WorkHistoryFact } from '@/modules/work-history';

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
): WorkHistoryFact => ({
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

export const workSessionCompletedFactsToEffectFacts = (
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
