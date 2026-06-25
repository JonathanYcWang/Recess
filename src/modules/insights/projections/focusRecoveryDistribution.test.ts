import { describe, expect, it } from 'vitest';
import { createFocusBlockCompletedFact } from '@/modules/work-rhythm/focusBlockCompleted';
import { createRecessCompletedFact } from '@/modules/work-rhythm/recessCompleted';
import { createWorkSessionCompletedFact } from '@/modules/work-rhythm/workSessionCompleted';
import { calculateFocusRecoveryDistribution } from '@/modules/insights';

describe('focus and recovery distribution projection', () => {
  it('calculates focus and recess shares from completed session facts', () => {
    const facts = [
      createWorkSessionCompletedFact({
        factId: 'work-session-completed-s1',
        recordedAt: 1,
        workSessionId: 's1',
        originalGoalSeconds: 3600,
        actualWorkedSeconds: 2000,
        completedAt: 1,
        originalGoalPermanentlyComplete: true,
      }),
      createFocusBlockCompletedFact({
        factId: 'focus-1',
        recordedAt: 1,
        workSessionId: 's1',
        focusBlockIndex: 0,
        plannedFocusMinutes: 25,
        actualFocusSeconds: 1500,
        completedAt: 1,
        energyAtStart: 'steady',
        wasExtension: false,
      }),
      createRecessCompletedFact({
        factId: 'recess-1',
        recordedAt: 2,
        workSessionId: 's1',
        focusBlockIndex: 0,
        startedAtEpochMs: 1,
        endedAtEpochMs: 2,
        actualRecessSeconds: 500,
        endedEarly: false,
      }),
    ];
    const result = calculateFocusRecoveryDistribution(facts, 'all-time');
    expect(result.state).toBe('calculated');
    expect(result.value?.focusPercent).toBeCloseTo(75);
    expect(result.value?.recessPercent).toBeCloseTo(25);
  });

  it('returns no relevant data when no resolved sessions exist', () => {
    const result = calculateFocusRecoveryDistribution([], 'all-time');
    expect(result.state).toBe('no-relevant-data');
  });

  it('returns 100% focus when recess seconds are zero', () => {
    const facts = [
      createWorkSessionCompletedFact({
        factId: 'work-session-completed-s1',
        recordedAt: 1,
        workSessionId: 's1',
        originalGoalSeconds: 3600,
        actualWorkedSeconds: 1500,
        completedAt: 1,
        originalGoalPermanentlyComplete: true,
      }),
      createFocusBlockCompletedFact({
        factId: 'focus-1',
        recordedAt: 1,
        workSessionId: 's1',
        focusBlockIndex: 0,
        plannedFocusMinutes: 25,
        actualFocusSeconds: 1500,
        completedAt: 1,
        energyAtStart: 'steady',
        wasExtension: false,
      }),
    ];
    const result = calculateFocusRecoveryDistribution(facts, 'all-time');
    expect(result.state).toBe('calculated');
    expect(result.value?.focusPercent).toBe(100);
    expect(result.value?.recessPercent).toBe(0);
  });
});
