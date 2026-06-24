import type { EffectAdapter, EffectIntent } from '../types';

export const INTEGRATION_FIXTURE_EFFECT_KIND = 'integration-fixture';

export interface FixtureEffectAdapterOptions {
  deliveredIntentIds?: string[];
  onDeliver?: (intent: EffectIntent) => void | Promise<void>;
  failIntentIds?: Set<string>;
}

export const createFixtureEffectAdapter = (
  options: FixtureEffectAdapterOptions = {}
): EffectAdapter & { deliveredIntentIds: string[] } => {
  const deliveredIntentIds = options.deliveredIntentIds ?? [];

  return {
    kind: INTEGRATION_FIXTURE_EFFECT_KIND,
    deliveredIntentIds,
    async execute(intent) {
      if (options.failIntentIds?.has(intent.intentId)) {
        return { ok: false, error: 'fixture effect failed' };
      }
      if (deliveredIntentIds.includes(intent.intentId)) {
        return { ok: true };
      }
      deliveredIntentIds.push(intent.intentId);
      await options.onDeliver?.(intent);
      return { ok: true };
    },
  };
};
