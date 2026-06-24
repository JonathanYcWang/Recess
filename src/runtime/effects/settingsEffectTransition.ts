import type { SettingsCommandResponse } from '../types';
import type { EffectExecutor } from './effectExecutor';
import { INTEGRATION_FIXTURE_EFFECT_KIND } from './integration/fixtureEffectAdapter';
import type { EffectIntent } from './types';

export const createSettingsEffectIntent = (input: {
  commandId: string;
  preference: string;
}): EffectIntent => ({
  intentId: `effect-${input.commandId}`,
  commandId: input.commandId,
  module: 'settings',
  kind: INTEGRATION_FIXTURE_EFFECT_KIND,
  facts: {
    preference: input.preference,
  },
});

export const runSettingsEffectTransition = async (input: {
  executor: EffectExecutor;
  commandId: string;
  preference: string;
  outcomeRevision: number;
  response: SettingsCommandResponse;
}): Promise<SettingsCommandResponse> => {
  if (!input.response.ok) {
    return input.response;
  }

  const intent = createSettingsEffectIntent({
    commandId: input.commandId,
    preference: input.preference,
  });
  await input.executor.persistTransition({
    intent,
    outcomeRevision: input.outcomeRevision,
  });
  try {
    await input.executor.executeIntent(intent.intentId);
  } catch {
    // Settings commit stands; pending effects roll forward later.
  }
  return input.response;
};
