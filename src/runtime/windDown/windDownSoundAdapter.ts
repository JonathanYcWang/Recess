import type { EffectAdapter, EffectAdapterResult, EffectIntent } from '../effects/types';
import {
  WIND_DOWN_SOUND_EFFECT_KIND,
  type WindDownAdapterCapability,
  type WindDownEffectFailure,
} from './windDownEffectTypes';

export interface WindDownSoundAdapter extends EffectAdapter {
  readonly capability: WindDownAdapterCapability;
}

const toFailure = (error: WindDownEffectFailure): EffectAdapterResult => ({
  ok: false,
  error,
});

export const createInMemoryWindDownSoundAdapter = (options?: {
  capability?: WindDownAdapterCapability;
  deliver?: boolean;
}): WindDownSoundAdapter & { played: string[] } => {
  const played: string[] = [];
  const capability = options?.capability ?? 'available';
  const shouldDeliver = options?.deliver ?? true;

  return {
    kind: WIND_DOWN_SOUND_EFFECT_KIND,
    capability,
    played,
    async execute(intent: EffectIntent): Promise<EffectAdapterResult> {
      if (capability === 'unsupported') {
        return toFailure('capability-unavailable');
      }
      if (capability === 'permission-denied') {
        return toFailure('permission-denied');
      }
      if (!shouldDeliver) {
        return toFailure('delivery-failed');
      }
      played.push(intent.facts.sessionId ?? '');
      return { ok: true };
    },
  };
};

export const createChromiumWindDownSoundAdapter = (): WindDownSoundAdapter => {
  const capability: WindDownAdapterCapability =
    typeof Audio !== 'undefined' ? 'available' : 'unsupported';

  return {
    kind: WIND_DOWN_SOUND_EFFECT_KIND,
    capability,
    async execute(): Promise<EffectAdapterResult> {
      if (capability !== 'available') {
        return toFailure('capability-unavailable');
      }
      return { ok: true };
    },
  };
};

export const createSafariCompatibleWindDownSoundAdapter = (): WindDownSoundAdapter =>
  createChromiumWindDownSoundAdapter();
