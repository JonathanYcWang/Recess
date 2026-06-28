import type { InsightResult, InsightResultState } from '@/modules/insights';

export const INSIGHT_WINDOW_OPTIONS = [
  {
    id: 'recent-5' as const,
    label: 'Recent 5',
    description: 'Latest 5 resolved Work Sessions or Reminder occurrences',
  },
  {
    id: 'recent-30' as const,
    label: 'Recent 30',
    description: 'Latest 30 resolved Work Sessions or Reminder occurrences',
  },
  {
    id: 'all-time' as const,
    label: 'All time',
    description: 'All resolved Work Sessions or Reminder occurrences',
  },
];

const insightStateLabel = (state: InsightResultState): string => {
  switch (state) {
    case 'no-relevant-data':
      return 'No relevant data yet';
    case 'insufficient-data':
      return 'Not enough data';
    case 'explicit-zero':
      return 'Explicit zero';
    case 'calculated':
      return 'Calculated';
    case 'query-error':
      return 'Unable to load Insights';
    default:
      return 'Unknown state';
  }
};

export const formatPercent = (value: number): string => `${value.toFixed(1)}%`;

export const formatSeconds = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder === 0 ? `${minutes}m` : `${minutes}m ${remainder}s`;
};

export const describeInsightResult = <TValue>(
  result: InsightResult<TValue> | null | undefined
): string => {
  if (!result) {
    return insightStateLabel('query-error');
  }
  if (result.state === 'insufficient-data') {
    return `Need at least ${result.requiredCount ?? 0}; have ${result.actualCount ?? 0}.`;
  }
  return insightStateLabel(result.state);
};
