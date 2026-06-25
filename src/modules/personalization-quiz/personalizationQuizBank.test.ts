import { describe, expect, it } from 'vitest';
import { FRICTION_DIMENSIONS } from '@/modules/workstyle-profile';
import {
  personalizationQuizBank,
  personalizationQuizScreeningScenarios,
  personalizationQuizTieBreakerScenarios,
} from './personalizationQuizBank';

const FORBIDDEN_TERMS = [
  'mbti',
  'personality type',
  'introvert',
  'extrovert',
  'kingdom',
  'quest',
  'squadron',
  'minion',
  'dragon',
];

describe('personalizationQuizBank', () => {
  it('contains six screening and eighteen tie-breaker scenarios with stable IDs', () => {
    expect(personalizationQuizScreeningScenarios).toHaveLength(6);
    expect(personalizationQuizTieBreakerScenarios).toHaveLength(18);
    expect(personalizationQuizBank.scenarios).toHaveLength(24);

    const ids = personalizationQuizBank.scenarios.map((scenario) => scenario.id);
    expect(new Set(ids).size).toBe(24);
  });

  it('assigns explicit scoring effects for every friction dimension on each option', () => {
    for (const scenario of personalizationQuizBank.scenarios) {
      expect(scenario.text.trim().length).toBeGreaterThan(0);
      expect(scenario.options.length).toBeGreaterThanOrEqual(2);

      for (const option of scenario.options) {
        expect(option.id.trim().length).toBeGreaterThan(0);
        expect(option.text.trim().length).toBeGreaterThan(0);

        for (const dimension of FRICTION_DIMENSIONS) {
          expect(typeof option.scoringEffects[dimension]).toBe('number');
        }
      }
    }
  });

  it('covers all fifteen unordered friction pairs across tie-breakers', () => {
    const coveredPairs = new Set<string>();
    for (const scenario of personalizationQuizTieBreakerScenarios) {
      expect(scenario.disambiguates).toBeDefined();
      const [a, b] = scenario.disambiguates!;
      const key = a < b ? `${a}|${b}` : `${b}|${a}`;
      coveredPairs.add(key);
    }

    const expectedPairs: string[] = [];
    for (let i = 0; i < FRICTION_DIMENSIONS.length; i += 1) {
      for (let j = i + 1; j < FRICTION_DIMENSIONS.length; j += 1) {
        const a = FRICTION_DIMENSIONS[i];
        const b = FRICTION_DIMENSIONS[j];
        expectedPairs.push(a < b ? `${a}|${b}` : `${b}|${a}`);
      }
    }
    expect(expectedPairs).toHaveLength(15);
    for (const pair of expectedPairs) {
      expect(coveredPairs.has(pair)).toBe(true);
    }
  });

  it('avoids MBTI and fantasy framing in scenario and option copy', () => {
    for (const scenario of personalizationQuizBank.scenarios) {
      const copy =
        `${scenario.text} ${scenario.options.map((option) => option.text).join(' ')}`.toLowerCase();
      for (const term of FORBIDDEN_TERMS) {
        expect(copy.includes(term)).toBe(false);
      }
    }
  });

  it('uses non-negative integer scoring effects', () => {
    for (const scenario of personalizationQuizBank.scenarios) {
      for (const option of scenario.options) {
        for (const dimension of FRICTION_DIMENSIONS) {
          const score = option.scoringEffects[dimension];
          expect(Number.isInteger(score)).toBe(true);
          expect(score).toBeGreaterThanOrEqual(0);
        }
        expect(FRICTION_DIMENSIONS.some((dimension) => option.scoringEffects[dimension] > 0)).toBe(
          true
        );
      }
    }
  });
});
