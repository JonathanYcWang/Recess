import { describe, expect, it } from 'vitest';
import { createTimeOutEndedFact } from '@/modules/work-rhythm/timeOutEnded';
import { createWorkSessionCompletedFact } from '@/modules/work-rhythm/workSessionCompleted';
import { calculateTimeOutPatterns } from '@/modules/insights';

describe('time out patterns projection', () => {
  it('returns explicit zero when resolved sessions have no time outs', () => {
    const facts = [
      createWorkSessionCompletedFact({
        factId: 'work-session-completed-s1',
        recordedAt: 1,
        workSessionId: 's1',
        originalGoalSeconds: 3600,
        actualWorkedSeconds: 3000,
        completedAt: 1,
        originalGoalPermanentlyComplete: true,
      }),
    ];
    const result = calculateTimeOutPatterns(facts, 'all-time');
    expect(result.state).toBe('explicit-zero');
    expect(result.value?.count).toBe(0);
  });

  it('returns no relevant data without resolved sessions', () => {
    const result = calculateTimeOutPatterns([], 'all-time');
    expect(result.state).toBe('no-relevant-data');
  });

  it('calculates count, total, average, and session share from ended intervals', () => {
    const facts = [
      createWorkSessionCompletedFact({
        factId: 'work-session-completed-s1',
        recordedAt: 1,
        workSessionId: 's1',
        originalGoalSeconds: 3600,
        actualWorkedSeconds: 3000,
        completedAt: 1,
        originalGoalPermanentlyComplete: false,
      }),
      createTimeOutEndedFact({
        factId: 'timeout-1',
        recordedAt: 2,
        workSessionId: 's1',
        focusBlockIndex: 0,
        startedAtEpochMs: 1,
        endedAtEpochMs: 2,
        durationSeconds: 120,
      }),
      createTimeOutEndedFact({
        factId: 'timeout-2',
        recordedAt: 3,
        workSessionId: 's1',
        focusBlockIndex: 1,
        startedAtEpochMs: 2,
        endedAtEpochMs: 3,
        durationSeconds: 180,
      }),
    ];
    const result = calculateTimeOutPatterns(facts, 'all-time');
    expect(result.state).toBe('calculated');
    expect(result.value?.count).toBe(2);
    expect(result.value?.totalSeconds).toBe(300);
    expect(result.value?.averageSeconds).toBe(150);
    expect(result.value?.sessionsWithTimeOutPercent).toBe(100);
  });
});
