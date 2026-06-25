import { describe, expect, it } from 'vitest';
import { FRICTION_DIMENSIONS } from '@/modules/workstyle-profile';
import { createZeroFrictionScoreEffects } from './personalizationQuizTypes';
import {
  applyPersonalizationQuizAnswer,
  BALANCED_STOP_GAP,
  evaluatePersonalizationQuizResult,
  MAX_SCREENING_QUESTIONS,
  MAX_TOTAL_QUESTIONS,
  nextPersonalizationQuizScenarioId,
  rankFrictionScores,
  SCREENING_STOP_GAP,
  secondToThirdGap,
  selectDeterministicTieBreakers,
  topTwoDimensions,
} from './personalizationQuizEngine';
import { personalizationQuizScreeningScenarios } from './personalizationQuizBank';

const answerScreeningWithOptionIndex = (
  scores = createZeroFrictionScoreEffects(),
  asked: string[] = [],
  optionIndex = 0
) => {
  const scenarioId = nextPersonalizationQuizScenarioId(asked, scores);
  expect(scenarioId).not.toBeNull();
  const scenario = personalizationQuizScreeningScenarios.find((entry) => entry.id === scenarioId);
  expect(scenario).toBeDefined();
  const option = scenario!.options[optionIndex] ?? scenario!.options[0];
  return applyPersonalizationQuizAnswer(scores, asked, scenarioId!, option.id);
};

describe('personalizationQuizEngine', () => {
  it('asks the six screening questions in stable order before tie-breakers', () => {
    let asked: string[] = [];
    let scores = createZeroFrictionScoreEffects();

    for (let index = 0; index < MAX_SCREENING_QUESTIONS; index += 1) {
      const nextId = nextPersonalizationQuizScenarioId(asked, scores);
      expect(nextId).toBe(personalizationQuizScreeningScenarios[index]?.id);
      const applied = answerScreeningWithOptionIndex(scores, asked, 0);
      expect(applied.ok).toBe(true);
      if (!applied.ok) {
        return;
      }
      asked = applied.value.askedScenarioIds;
      scores = applied.value.scores;
    }

    const tieBreaker = nextPersonalizationQuizScenarioId(asked, scores);
    expect(tieBreaker?.startsWith('psq-tie-')).toBe(true);
  });

  it('stops after question six when second place leads third by at least three points', () => {
    let asked: string[] = [];
    let scores = createZeroFrictionScoreEffects();

    for (let index = 0; index < MAX_SCREENING_QUESTIONS; index += 1) {
      const applied = answerScreeningWithOptionIndex(scores, asked, 0);
      expect(applied.ok).toBe(true);
      if (!applied.ok) {
        return;
      }
      asked = applied.value.askedScenarioIds;
      scores = applied.value.scores;
    }

    if (secondToThirdGap(scores) >= SCREENING_STOP_GAP) {
      const result = evaluatePersonalizationQuizResult(scores, asked.length);
      expect(result?.kind).toBe('top-two');
      if (result?.kind === 'top-two') {
        expect(result.dimensions).toEqual(topTwoDimensions(scores));
      }
    }
  });

  it('resolves exact score ties with stable dimension ordering', () => {
    const scores = createZeroFrictionScoreEffects();
    for (const dimension of FRICTION_DIMENSIONS) {
      scores[dimension] = 4;
    }
    const ranked = rankFrictionScores(scores);
    expect(ranked.map((entry) => entry.dimension)).toEqual([...FRICTION_DIMENSIONS].sort());
  });

  it('selects tie-breakers deterministically from the approved bank', () => {
    const asked = personalizationQuizScreeningScenarios.map((scenario) => scenario.id);
    const scores = createZeroFrictionScoreEffects();
    scores.motivation = 4;
    scores.organization = 4;
    scores.distraction = 1;

    const first = selectDeterministicTieBreakers(asked, scores);
    const second = selectDeterministicTieBreakers(asked, scores);
    expect(first).toEqual(second);
    expect(first.length).toBeGreaterThan(0);
  });

  it('returns Balanced after twelve questions when the second-to-third gap stays below one', () => {
    const scores = createZeroFrictionScoreEffects();
    scores.motivation = 5;
    scores.organization = 5;
    scores.distraction = 5;
    scores.starting = 5;
    scores.fatigue = 5;
    scores['emotional-load'] = 4;

    const result = evaluatePersonalizationQuizResult(scores, MAX_TOTAL_QUESTIONS);
    expect(result).toEqual({ kind: 'balanced' });
    expect(secondToThirdGap(scores)).toBeLessThan(BALANCED_STOP_GAP);
  });
});
