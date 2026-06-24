import type { EffectAdapter, EffectAdapterResult, EffectIntent } from '../effects/types';
import {
  WIND_DOWN_NOTIFICATION_EFFECT_KIND,
  type WindDownAdapterCapability,
  type WindDownEffectFailure,
  type WindDownSignalPayload,
  windDownSignalPayloadFromFacts,
} from './windDownEffectTypes';

export interface WindDownNotificationAdapter extends EffectAdapter {
  readonly capability: WindDownAdapterCapability;
}

const toFailure = (error: WindDownEffectFailure): EffectAdapterResult => ({
  ok: false,
  error,
});

export const createInMemoryWindDownNotificationAdapter = (options?: {
  capability?: WindDownAdapterCapability;
  deliver?: boolean;
}): WindDownNotificationAdapter & { delivered: WindDownSignalPayload[] } => {
  const delivered: WindDownSignalPayload[] = [];
  const capability = options?.capability ?? 'available';
  const shouldDeliver = options?.deliver ?? true;

  return {
    kind: WIND_DOWN_NOTIFICATION_EFFECT_KIND,
    capability,
    delivered,
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
      delivered.push(windDownSignalPayloadFromFacts(intent.facts));
      return { ok: true };
    },
  };
};

export const createChromiumWindDownNotificationAdapter = (): WindDownNotificationAdapter => {
  const capability: WindDownAdapterCapability =
    typeof chrome !== 'undefined' && typeof chrome.runtime?.sendMessage === 'function'
      ? 'available'
      : 'unsupported';

  return {
    kind: WIND_DOWN_NOTIFICATION_EFFECT_KIND,
    capability,
    async execute(intent: EffectIntent): Promise<EffectAdapterResult> {
      if (capability !== 'available') {
        return toFailure('capability-unavailable');
      }
      const payload = windDownSignalPayloadFromFacts(intent.facts);
      await new Promise<void>((resolve) => {
        chrome.runtime.sendMessage(
          {
            type: 'SESSION_NOTIFICATION',
            title: 'Focus ending soon',
            message: `${payload.remainingSeconds} seconds left in your focus block.`,
          },
          () => {
            void chrome.runtime.lastError;
            resolve();
          }
        );
      });
      return { ok: true };
    },
  };
};

export const createSafariCompatibleWindDownNotificationAdapter = (): WindDownNotificationAdapter =>
  createChromiumWindDownNotificationAdapter();
