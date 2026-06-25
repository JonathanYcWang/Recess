import type { EffectIntent } from '../effects/types';
import { WORK_HISTORY_APPEND_EFFECT_KIND } from '../effects/workHistoryEffectAdapter';
import type { EffectExecutor } from '../effects/effectExecutor';
import { workHistoryFactToEffectFacts } from '@/modules/work-history/factCodec';
import type { WorkHistoryFact } from '@/modules/work-history';

export const createWorkHistoryAppendEffectIntent = (input: {
  commandId: string;
  fact: WorkHistoryFact;
}): EffectIntent => ({
  intentId: `effect-${input.commandId}-${input.fact.id}`,
  commandId: input.commandId,
  module: 'work-history',
  kind: WORK_HISTORY_APPEND_EFFECT_KIND,
  facts: workHistoryFactToEffectFacts(input.fact),
});

export const runWorkHistoryAppendEffectTransition = async (input: {
  executor: EffectExecutor;
  commandId: string;
  fact: WorkHistoryFact;
  outcomeRevision: number;
}): Promise<void> => {
  const intent = createWorkHistoryAppendEffectIntent({
    commandId: input.commandId,
    fact: input.fact,
  });
  await input.executor.persistTransition({
    intent,
    outcomeRevision: input.outcomeRevision,
  });
  try {
    await input.executor.executeIntent(intent.intentId);
  } catch {
    // Operational commit stands; pending effects roll forward later.
  }
};
