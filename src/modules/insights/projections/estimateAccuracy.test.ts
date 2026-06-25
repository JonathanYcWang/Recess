import { describe, expect, it } from 'vitest';
import { createTaskCompletedFact } from '@/modules/task-list/taskCompleted';
import { createWorkSessionCompletedFact } from '@/modules/work-rhythm/workSessionCompleted';
import type { WorkHistoryFact } from '@/modules/work-history';
import { calculateEstimateAccuracy, ESTIMATE_ACCURACY_MIN_TASKS } from '@/modules/insights';

const sessionCompleted = (sessionId: string, completedAt: number): WorkHistoryFact =>
  createWorkSessionCompletedFact({
    factId: `work-session-completed-${sessionId}`,
    recordedAt: completedAt,
    workSessionId: sessionId,
    originalGoalSeconds: 3600,
    actualWorkedSeconds: 3000,
    completedAt,
    originalGoalPermanentlyComplete: true,
  });

const taskCompleted = (
  taskId: string,
  sessionId: string,
  estimateMinutes: number,
  focusedSeconds: number,
  completedAt: number
): WorkHistoryFact =>
  createTaskCompletedFact({
    factId: `task-completed-${taskId}`,
    recordedAt: completedAt,
    taskId,
    workSessionId: sessionId,
    originalEstimateMinutes: estimateMinutes,
    totalFocusedTimeSeconds: focusedSeconds,
    completedAtEpochMs: completedAt,
  });

describe('estimate accuracy projection', () => {
  it('calculates accuracy from exact estimates across three tasks', () => {
    const facts = [
      sessionCompleted('s1', 100),
      sessionCompleted('s2', 200),
      taskCompleted('t1', 's1', 60, 3600, 100),
      taskCompleted('t2', 's2', 30, 1800, 200),
      taskCompleted('t3', 's2', 45, 2700, 210),
    ];
    const result = calculateEstimateAccuracy(facts, 'recent-5');
    expect(result.state).toBe('calculated');
    expect(result.value?.accuracyScore).toBe(100);
    expect(result.value?.signedMeanVariancePercent).toBe(0);
    expect(result.explanation?.sourceFactIds.length).toBeGreaterThan(0);
  });

  it('returns insufficient data when fewer than three completed tasks exist', () => {
    const facts = [sessionCompleted('s1', 1), taskCompleted('t1', 's1', 30, 1800, 1)];
    const result = calculateEstimateAccuracy(facts, 'all-time');
    expect(result.state).toBe('insufficient-data');
    expect(result.requiredCount).toBe(ESTIMATE_ACCURACY_MIN_TASKS);
    expect(result.actualCount).toBe(1);
  });

  it('reports mixed over and under estimation as signed variance', () => {
    const facts = [
      sessionCompleted('s1', 1),
      sessionCompleted('s2', 2),
      taskCompleted('t1', 's1', 60, 7200, 1),
      taskCompleted('t2', 's2', 60, 1800, 2),
      taskCompleted('t3', 's2', 60, 3600, 3),
    ];
    const result = calculateEstimateAccuracy(facts, 'all-time');
    expect(result.state).toBe('calculated');
    expect(result.value!.signedMeanVariancePercent).toBeGreaterThan(0);
    expect(result.value!.accuracyScore).toBeLessThan(100);
  });
});
