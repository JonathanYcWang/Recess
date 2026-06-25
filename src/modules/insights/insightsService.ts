import type { WorkHistoryService } from '@/modules/work-history';
import { calculateEstimateAccuracy } from './projections/estimateAccuracy';
import { calculateFocusRecoveryDistribution } from './projections/focusRecoveryDistribution';
import { calculateReminderAdherence } from './projections/reminderAdherence';
import { calculateTimeOutPatterns } from './projections/timeOutPatterns';
import type { InsightQueryError, InsightWindow } from './types';

export interface InsightsSnapshot {
  window: InsightWindow;
  estimateAccuracy: ReturnType<typeof calculateEstimateAccuracy>;
  focusRecovery: ReturnType<typeof calculateFocusRecoveryDistribution>;
  timeOutPatterns: ReturnType<typeof calculateTimeOutPatterns>;
  reminderAdherence: ReturnType<typeof calculateReminderAdherence>;
}

export type InsightsSnapshotOutcome =
  | { ok: true; value: InsightsSnapshot }
  | { ok: false; error: InsightQueryError };

export const queryInsightsSnapshot = async (
  workHistory: WorkHistoryService,
  window: InsightWindow
): Promise<InsightsSnapshotOutcome> => {
  const queried = await workHistory.query();
  if (!queried.ok) {
    return { ok: false, error: { kind: 'query-failed', cause: queried.error } };
  }

  const facts = queried.value;
  return {
    ok: true,
    value: {
      window,
      estimateAccuracy: calculateEstimateAccuracy(facts, window),
      focusRecovery: calculateFocusRecoveryDistribution(facts, window),
      timeOutPatterns: calculateTimeOutPatterns(facts, window),
      reminderAdherence: calculateReminderAdherence(facts, window),
    },
  };
};
