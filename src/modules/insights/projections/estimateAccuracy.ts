import type { WorkHistoryFact } from '@/modules/work-history';
import { selectTaskCompletionFactsInWindow, totalFocusedTimeSecondsForTask } from '../queryWindows';
import type { InsightQueryOutcome, InsightResult, InsightWindow } from '../types';

export const ESTIMATE_ACCURACY_FORMULA_ID = 'estimate-accuracy';
export const ESTIMATE_ACCURACY_FORMULA_VERSION = 1;
export const ESTIMATE_ACCURACY_MIN_TASKS = 3;

export interface EstimateAccuracyValue {
  accuracyScore: number;
  signedMeanVariancePercent: number;
  taskCount: number;
}

const isValidCompletionFact = (fact: WorkHistoryFact): boolean =>
  fact.kind === 'task-completed' &&
  typeof fact.payload.taskId === 'string' &&
  typeof fact.payload.originalEstimateMinutes === 'number' &&
  fact.payload.originalEstimateMinutes > 0;

export const calculateEstimateAccuracy = (
  facts: readonly WorkHistoryFact[],
  window: InsightWindow
): InsightResult<EstimateAccuracyValue> => {
  const completions = selectTaskCompletionFactsInWindow(facts, window).filter(
    isValidCompletionFact
  );
  if (completions.length === 0) {
    return { state: 'no-relevant-data', value: null, explanation: null };
  }
  if (completions.length < ESTIMATE_ACCURACY_MIN_TASKS) {
    return {
      state: 'insufficient-data',
      value: null,
      explanation: null,
      requiredCount: ESTIMATE_ACCURACY_MIN_TASKS,
      actualCount: completions.length,
    };
  }

  const percentageErrors: number[] = [];
  const signedVariances: number[] = [];
  const sourceFactIds: string[] = [];

  for (const completion of completions) {
    const taskId = String(completion.payload.taskId);
    const estimateSeconds = Number(completion.payload.originalEstimateMinutes) * 60;
    const focusedSeconds = totalFocusedTimeSecondsForTask(facts, taskId, completion);
    const signedVariance = (focusedSeconds - estimateSeconds) / estimateSeconds;
    const percentageError = Math.abs(signedVariance) * 100;
    percentageErrors.push(percentageError);
    signedVariances.push(signedVariance);
    sourceFactIds.push(completion.id);
    const attributionIds = facts
      .filter(
        (fact) => fact.kind === 'task-focused-time-attributed' && fact.payload.taskId === taskId
      )
      .map((fact) => fact.id);
    sourceFactIds.push(...attributionIds);
  }

  const meanPercentageError =
    percentageErrors.reduce((sum, value) => sum + value, 0) / percentageErrors.length;
  const accuracyScore = Math.max(0, 100 - meanPercentageError);
  const signedMeanVariancePercent =
    (signedVariances.reduce((sum, value) => sum + value, 0) / signedVariances.length) * 100;

  return {
    state: 'calculated',
    value: {
      accuracyScore,
      signedMeanVariancePercent,
      taskCount: completions.length,
    },
    explanation: {
      formulaId: ESTIMATE_ACCURACY_FORMULA_ID,
      formulaVersion: ESTIMATE_ACCURACY_FORMULA_VERSION,
      inputs: {
        taskCount: completions.length,
        meanPercentageError,
      },
      sourceFactIds: [...new Set(sourceFactIds)],
    },
  };
};

export const queryEstimateAccuracy = async (input: {
  queryFacts: () => Promise<
    { ok: true; value: readonly WorkHistoryFact[] } | { ok: false; error: unknown }
  >;
  window: InsightWindow;
}): Promise<InsightQueryOutcome<EstimateAccuracyValue>> => {
  const queried = await input.queryFacts();
  if (!queried.ok) {
    return { ok: false, error: { kind: 'query-failed', cause: queried.error } };
  }
  return { ok: true, value: calculateEstimateAccuracy(queried.value, input.window) };
};
