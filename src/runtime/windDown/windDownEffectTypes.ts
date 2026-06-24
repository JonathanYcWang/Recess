export const WIND_DOWN_NOTIFICATION_EFFECT_KIND = 'wind-down.notification';
export const WIND_DOWN_SOUND_EFFECT_KIND = 'wind-down.sound';

export type WindDownAdapterCapability = 'available' | 'unsupported' | 'permission-denied';

export type WindDownEffectFailure =
  | 'capability-unavailable'
  | 'permission-denied'
  | 'delivery-failed';

export interface WindDownSignalPayload {
  sessionId: string;
  phaseKind: string;
  remainingSeconds: string;
}

export const windDownSignalPayloadFromFacts = (
  facts: Record<string, string>
): WindDownSignalPayload => ({
  sessionId: facts.sessionId ?? '',
  phaseKind: facts.phaseKind ?? '',
  remainingSeconds: facts.remainingSeconds ?? '0',
});
