export type {
  InsightExplanation,
  InsightFamily,
  InsightQueryError,
  InsightQueryOutcome,
  InsightResult,
  InsightResultState,
  InsightWindow,
} from './types';

export { compareReminderOccurrences, compareResolvedWorkSessions, windowLimit } from './types';

export {
  selectFactsForWorkSessions,
  selectReminderOccurrenceFacts,
  selectResolvedWorkSessionIds,
  selectTaskCompletionFactsInWindow,
  totalFocusedTimeSecondsForTask,
} from './queryWindows';

export {
  calculateEstimateAccuracy,
  ESTIMATE_ACCURACY_FORMULA_ID,
  ESTIMATE_ACCURACY_MIN_TASKS,
  queryEstimateAccuracy,
  type EstimateAccuracyValue,
} from './projections/estimateAccuracy';
