import type { WorkHistoryFact } from '@/modules/work-history';
import {
  effectFactsToWorkHistoryFact,
  WORK_HISTORY_FACT_KINDS,
} from '@/modules/work-history/factCodec';
import type { EffectAdapter, EffectIntent } from './types';

export const WORK_HISTORY_APPEND_EFFECT_KIND = 'work-history.append';

const isWorkHistoryFactKind = (value: string): value is WorkHistoryFact['kind'] =>
  (WORK_HISTORY_FACT_KINDS as readonly string[]).includes(value);

export const createWorkHistoryEffectAdapter = (options: {
  append: (
    facts: readonly WorkHistoryFact[]
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
}): EffectAdapter => ({
  kind: WORK_HISTORY_APPEND_EFFECT_KIND,
  async execute(intent: EffectIntent) {
    const fact = effectFactsToWorkHistoryFact(intent.facts);
    if (!fact || !isWorkHistoryFactKind(fact.kind)) {
      return { ok: false, error: 'unsupported work history effect kind' };
    }

    return options.append([fact]);
  },
});
