import type { EffectIntent } from '../effects/types';
import type { EffectExecutor } from '../effects/effectExecutor';
import {
  WIND_DOWN_NOTIFICATION_EFFECT_KIND,
  WIND_DOWN_SOUND_EFFECT_KIND,
  type WindDownSignalPayload,
} from './windDownEffectTypes';

const createWindDownEffectIntent = (input: {
  commandId: string;
  kind: typeof WIND_DOWN_NOTIFICATION_EFFECT_KIND | typeof WIND_DOWN_SOUND_EFFECT_KIND;
  payload: WindDownSignalPayload;
}): EffectIntent => ({
  intentId: `effect-${input.commandId}-${input.kind}`,
  commandId: input.commandId,
  module: 'wind-down',
  kind: input.kind,
  facts: {
    sessionId: input.payload.sessionId,
    phaseKind: input.payload.phaseKind,
    remainingSeconds: input.payload.remainingSeconds,
  },
});

export const runWindDownEffectTransition = async (input: {
  executor: EffectExecutor;
  commandId: string;
  payload: WindDownSignalPayload;
  soundEnabled: boolean;
  outcomeRevision: number;
}): Promise<void> => {
  const notificationIntent = createWindDownEffectIntent({
    commandId: input.commandId,
    kind: WIND_DOWN_NOTIFICATION_EFFECT_KIND,
    payload: input.payload,
  });
  await input.executor.persistTransition({
    intent: notificationIntent,
    outcomeRevision: input.outcomeRevision,
  });
  try {
    await input.executor.executeIntent(notificationIntent.intentId);
  } catch {
    // Operational commit stands; pending effects roll forward later.
  }

  if (!input.soundEnabled) {
    return;
  }

  const soundIntent = createWindDownEffectIntent({
    commandId: `${input.commandId}-sound`,
    kind: WIND_DOWN_SOUND_EFFECT_KIND,
    payload: input.payload,
  });
  await input.executor.persistTransition({
    intent: soundIntent,
    outcomeRevision: input.outcomeRevision,
  });
  try {
    await input.executor.executeIntent(soundIntent.intentId);
  } catch {
    // Sound failure must not affect phase transitions.
  }
};
