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
