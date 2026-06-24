import type { WorkHistoryFact } from '@/modules/work-history';
import type { EffectAdapter, EffectIntent } from './types';

export const WORK_HISTORY_APPEND_EFFECT_KIND = 'work-history.append';

export const createWorkHistoryEffectAdapter = (options: {
  append: (
    facts: readonly WorkHistoryFact[]
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
}): EffectAdapter => ({
  kind: WORK_HISTORY_APPEND_EFFECT_KIND,
  async execute(intent: EffectIntent) {
    const factId = intent.facts.factId;
    const recordedAt = Number(intent.facts.recordedAt);
    if (!factId || !Number.isFinite(recordedAt)) {
      return { ok: false, error: 'work history effect missing fact identity' };
    }

    const payload: WorkHistoryFact['payload'] = {};
    for (const [key, value] of Object.entries(intent.facts)) {
      if (key === 'factId' || key === 'recordedAt' || key === 'kind') {
        continue;
      }
      if (value === 'true') {
        payload[key] = true;
      } else if (value === 'false') {
        payload[key] = false;
      } else if (value === 'null') {
        payload[key] = null;
      } else {
        const numeric = Number(value);
        payload[key] = Number.isFinite(numeric) && value.trim() !== '' ? numeric : value;
      }
    }

    const kind = intent.facts.kind;
    if (
      kind !== 'focus-block-completed' &&
      kind !== 'work-session-completed' &&
      kind !== 'work-session-started' &&
      kind !== 'recess-started' &&
      kind !== 'task-focused-time-attributed'
    ) {
      return { ok: false, error: 'unsupported work history effect kind' };
    }

    return options.append([
      {
        id: factId,
        recordedAt,
        kind,
        payload,
      },
    ]);
  },
});
