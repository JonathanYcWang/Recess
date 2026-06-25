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

export {
  calculateFocusRecoveryDistribution,
  FOCUS_RECOVERY_FORMULA_ID,
  type FocusRecoveryValue,
} from './projections/focusRecoveryDistribution';

export {
  calculateTimeOutPatterns,
  TIME_OUT_PATTERNS_FORMULA_ID,
  type TimeOutPatternsValue,
} from './projections/timeOutPatterns';

export {
  calculateReminderAdherence,
  REMINDER_ADHERENCE_FORMULA_ID,
  type ReminderAdherenceValue,
} from './projections/reminderAdherence';

export {
  queryInsightsSnapshot,
  type InsightsSnapshot,
  type InsightsSnapshotOutcome,
} from './insightsService';
