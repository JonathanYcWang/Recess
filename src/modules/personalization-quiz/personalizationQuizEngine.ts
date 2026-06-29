import type { Result } from '@/runtime/persistence/types';
import {
  FRICTION_DIMENSIONS,
  type FrictionDimension,
  type FrictionLevel,
  type FrictionProfile,
} from '@/modules/workstyle-profile';
import {
  getPersonalizationQuizScenarioById,
  personalizationQuizScreeningScenarios,
  personalizationQuizTieBreakerScenarios,
} from './personalizationQuizBank';
import type { FrictionScoreEffects } from './personalizationQuizTypes';

export const SCREENING_STOP_GAP = 3;
export const BALANCED_STOP_GAP = 1;
export const MAX_SCREENING_QUESTIONS = 6;
export const MAX_TIE_BREAKERS = 6;
export const MAX_TOTAL_QUESTIONS = MAX_SCREENING_QUESTIONS + MAX_TIE_BREAKERS;

export type PersonalizationQuizResult =
  | { kind: 'top-two'; dimensions: readonly [FrictionDimension, FrictionDimension] }
  | { kind: 'balanced' };

export interface RankedFriction {
  dimension: FrictionDimension;
  score: number;
}

export const normalizeFrictionPair = (
  a: FrictionDimension,
  b: FrictionDimension
): readonly [FrictionDimension, FrictionDimension] => (a < b ? [a, b] : [b, a]);

export const pairKey = (a: FrictionDimension, b: FrictionDimension): string => {
  const [left, right] = normalizeFrictionPair(a, b);
  return `${left}|${right}`;
};

export const rankFrictionScores = (scores: FrictionScoreEffects): RankedFriction[] =>
  FRICTION_DIMENSIONS.map((dimension) => ({
    dimension,
    score: scores[dimension],
  })).sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }
    return left.dimension.localeCompare(right.dimension);
  });

export const frictionProfileFromScores = (scores: FrictionScoreEffects): FrictionProfile => {
  const ranked = rankFrictionScores(scores);
  const profile: FrictionProfile = {
    emotionalLoad: 'low',
    motivation: 'low',
    organization: 'low',
    distraction: 'low',
    starting: 'low',
    fatigue: 'low',
  };

  const dimensionToField = (dimension: FrictionDimension): keyof FrictionProfile => {
    switch (dimension) {
      case 'emotional-load':
        return 'emotionalLoad';
      case 'motivation':
        return 'motivation';
      case 'organization':
        return 'organization';
      case 'distraction':
        return 'distraction';
      case 'starting':
        return 'starting';
      case 'fatigue':
        return 'fatigue';
    }
  };

  ranked.forEach((entry, index) => {
    const level: FrictionLevel = index <= 1 ? 'high' : index <= 3 ? 'moderate' : 'low';
    profile[dimensionToField(entry.dimension)] = level;
  });

  return profile;
};

export const secondToThirdGap = (scores: FrictionScoreEffects): number => {
  const ranked = rankFrictionScores(scores);
  return ranked[1].score - ranked[2].score;
};

export const topTwoDimensions = (
  scores: FrictionScoreEffects
): readonly [FrictionDimension, FrictionDimension] => {
  const ranked = rankFrictionScores(scores);
  return normalizeFrictionPair(ranked[0].dimension, ranked[1].dimension);
};

export const evaluatePersonalizationQuizResult = (
  scores: FrictionScoreEffects,
  answeredCount: number
): PersonalizationQuizResult | null => {
  if (answeredCount < MAX_SCREENING_QUESTIONS) {
    return null;
  }

  const gap = secondToThirdGap(scores);
  if (answeredCount === MAX_SCREENING_QUESTIONS && gap >= SCREENING_STOP_GAP) {
    return { kind: 'top-two', dimensions: topTwoDimensions(scores) };
  }

  if (answeredCount >= MAX_TOTAL_QUESTIONS && gap >= BALANCED_STOP_GAP) {
    return { kind: 'top-two', dimensions: topTwoDimensions(scores) };
  }

  if (answeredCount >= MAX_TOTAL_QUESTIONS) {
    return { kind: 'balanced' };
  }

  return null;
};

export const pairsNeedingDisambiguation = (
  scores: FrictionScoreEffects
): Array<readonly [FrictionDimension, FrictionDimension]> => {
  const ranked = rankFrictionScores(scores);
  const pairs: Array<readonly [FrictionDimension, FrictionDimension]> = [];

  if (ranked[0].score === ranked[1].score) {
    pairs.push(normalizeFrictionPair(ranked[0].dimension, ranked[1].dimension));
  }

  if (secondToThirdGap(scores) < SCREENING_STOP_GAP) {
    pairs.push(normalizeFrictionPair(ranked[1].dimension, ranked[2].dimension));
  }

  const seen = new Set<string>();
  return pairs.filter((pair) => {
    const key = pairKey(pair[0], pair[1]);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

export const selectDeterministicTieBreakers = (
  askedScenarioIds: readonly string[],
  scores: FrictionScoreEffects
): string[] => {
  const asked = new Set(askedScenarioIds);
  const neededPairs = pairsNeedingDisambiguation(scores).map((pair) => pairKey(pair[0], pair[1]));
  const selected: string[] = [];

  for (const pair of neededPairs) {
    if (selected.length >= MAX_TIE_BREAKERS) {
      break;
    }
    const candidates = personalizationQuizTieBreakerScenarios
      .filter((scenario) => {
        if (asked.has(scenario.id) || selected.includes(scenario.id)) {
          return false;
        }
        if (!scenario.disambiguates) {
          return false;
        }
        return pairKey(scenario.disambiguates[0], scenario.disambiguates[1]) === pair;
      })
      .sort((left, right) => left.id.localeCompare(right.id));

    if (candidates[0]) {
      selected.push(candidates[0].id);
    }
  }

  if (selected.length < MAX_TIE_BREAKERS) {
    const fallback = personalizationQuizTieBreakerScenarios
      .filter((scenario) => !asked.has(scenario.id) && !selected.includes(scenario.id))
      .sort((left, right) => left.id.localeCompare(right.id));
    for (const scenario of fallback) {
      if (selected.length >= MAX_TIE_BREAKERS) {
        break;
      }
      selected.push(scenario.id);
    }
  }

  return selected;
};

export const buildPersonalizationQuizSequence = (
  askedScenarioIds: readonly string[],
  scores: FrictionScoreEffects
): string[] => {
  const sequence = personalizationQuizScreeningScenarios.map((scenario) => scenario.id);
  if (askedScenarioIds.length >= MAX_SCREENING_QUESTIONS) {
    sequence.push(...selectDeterministicTieBreakers(askedScenarioIds, scores));
  }
  return sequence;
};

export const nextPersonalizationQuizScenarioId = (
  askedScenarioIds: readonly string[],
  scores: FrictionScoreEffects
): string | null => {
  const sequence = buildPersonalizationQuizSequence(askedScenarioIds, scores);
  return sequence.find((scenarioId) => !askedScenarioIds.includes(scenarioId)) ?? null;
};

export const applyPersonalizationQuizAnswer = (
  scores: FrictionScoreEffects,
  askedScenarioIds: readonly string[],
  scenarioId: string,
  optionId: string
): Result<
  {
    scores: FrictionScoreEffects;
    askedScenarioIds: string[];
    result: PersonalizationQuizResult | null;
    nextScenarioId: string | null;
  },
  'unknown-scenario' | 'unknown-option'
> => {
  const scenario = getPersonalizationQuizScenarioById(scenarioId);
  if (!scenario) {
    return { ok: false, error: 'unknown-scenario' };
  }
  const option = scenario.options.find((entry) => entry.id === optionId);
  if (!option) {
    return { ok: false, error: 'unknown-option' };
  }

  const nextScores: FrictionScoreEffects = { ...scores };
  for (const dimension of FRICTION_DIMENSIONS) {
    nextScores[dimension] += option.scoringEffects[dimension];
  }

  const nextAsked = [...askedScenarioIds, scenarioId];
  const result = evaluatePersonalizationQuizResult(nextScores, nextAsked.length);
  const nextScenarioId = result ? null : nextPersonalizationQuizScenarioId(nextAsked, nextScores);

  return {
    ok: true,
    value: {
      scores: nextScores,
      askedScenarioIds: nextAsked,
      result,
      nextScenarioId,
    },
  };
};
