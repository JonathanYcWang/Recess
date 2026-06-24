import { describe, expect, it } from 'vitest';
import { decideFocusRecessCycle, type RewardGameBudget, type SchedulerInput } from './index';
import { cadenceToBaseDurations } from './cadence';

const baseInput = (overrides: Partial<SchedulerInput> = {}): SchedulerInput => ({
  preferredCadence: '25/5',
  energy: 'steady',
  momentum: 'steady',
  workSessionProgressRatio: 0,
  selectedTaskRemainingMinutes: null,
  remainingWorkSessionSeconds: 90 * 60,
  gameBudget: { kind: 'wheel' },
  ...overrides,
});

describe('cadenceToBaseDurations', () => {
  it('maps approved cadences to focus and recess minutes', () => {
    expect(cadenceToBaseDurations('15/5')).toEqual({ focusMinutes: 15, recessMinutes: 5 });
    expect(cadenceToBaseDurations('25/5')).toEqual({ focusMinutes: 25, recessMinutes: 5 });
    expect(cadenceToBaseDurations('45/10')).toEqual({ focusMinutes: 45, recessMinutes: 10 });
  });
});

describe('decideFocusRecessCycle', () => {
  it('begins from preferred cadence with 25/5 default behavior', () => {
    const decision = decideFocusRecessCycle(baseInput());
    expect(decision.focusMinutes).toBe(25);
    expect(decision.recessMinutes).toBe(5);
    expect(decision.reasons.map((reason) => reason.code)).toContain('base-cadence');
  });

  it('applies energy, momentum, and two-thirds-progress modifiers in order', () => {
    const decision = decideFocusRecessCycle(
      baseInput({
        energy: 'low',
        momentum: 'flowing',
        workSessionProgressRatio: 0.7,
      })
    );
    expect(decision.reasons.map((reason) => reason.code)).toEqual([
      'base-cadence',
      'energy-low',
      'momentum-flowing',
      'two-thirds-progress',
    ]);
  });

  it('clamps ordinary focus and recess durations', () => {
    const decision = decideFocusRecessCycle(
      baseInput({
        preferredCadence: '45/10',
        energy: 'high',
        momentum: 'flowing',
        remainingWorkSessionSeconds: 8 * 60 * 60,
      })
    );
    expect(decision.focusMinutes).toBeLessThanOrEqual(60);
    expect(decision.recessMinutes).toBeGreaterThanOrEqual(5);
    expect(decision.recessMinutes).toBeLessThanOrEqual(20);
  });

  it('caps proposed focus by eligible selected task remaining work', () => {
    const decision = decideFocusRecessCycle(
      baseInput({
        selectedTaskRemainingMinutes: 18,
      })
    );
    expect(decision.focusMinutes).toBe(18);
    expect(decision.reasons.some((reason) => reason.code === 'task-cap')).toBe(true);
  });

  it('marks the current focus final when game budget cannot fit', () => {
    const budgets: RewardGameBudget[] = [{ kind: 'cards' }, { kind: 'wheel' }, { kind: 'slots' }];
    for (const gameBudget of budgets) {
      const decision = decideFocusRecessCycle(
        baseInput({
          remainingWorkSessionSeconds: 4 * 60,
          gameBudget,
        })
      );
      expect(decision.isFinalFocus).toBe(true);
      expect(decision.reasons.some((reason) => reason.code === 'final-focus-budget')).toBe(true);
    }
  });

  it('consumes exact remaining work session time for a final focus below fifteen minutes', () => {
    const decision = decideFocusRecessCycle(
      baseInput({
        remainingWorkSessionSeconds: 8 * 60,
        gameBudget: { kind: 'cards' },
      })
    );
    expect(decision.isFinalFocus).toBe(true);
    expect(decision.focusMinutes).toBe(8);
    expect(decision.recessMinutes).toBe(0);
  });
});
