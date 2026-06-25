import type { FrictionDimension } from '@/modules/workstyle-profile';

export const PERSONALIZATION_QUIZ_BANK_VERSION = 1 as const;

export type FrictionScoreEffects = Record<FrictionDimension, number>;

export interface PersonalizationQuizAnswerOption {
  id: string;
  text: string;
  scoringEffects: FrictionScoreEffects;
}

export interface PersonalizationQuizScenario {
  id: string;
  kind: 'screening' | 'tie-breaker';
  text: string;
  options: PersonalizationQuizAnswerOption[];
  /** Tie-breakers disambiguate between this unordered friction pair. */
  disambiguates?: readonly [FrictionDimension, FrictionDimension];
}

export interface PersonalizationQuizBank {
  version: typeof PERSONALIZATION_QUIZ_BANK_VERSION;
  scenarios: readonly PersonalizationQuizScenario[];
}

export const createZeroFrictionScoreEffects = (): FrictionScoreEffects => ({
  'emotional-load': 0,
  motivation: 0,
  organization: 0,
  distraction: 0,
  starting: 0,
  fatigue: 0,
});

export const frictionScoreEffects = (
  partial: Partial<FrictionScoreEffects>
): FrictionScoreEffects => ({
  ...createZeroFrictionScoreEffects(),
  ...partial,
});
