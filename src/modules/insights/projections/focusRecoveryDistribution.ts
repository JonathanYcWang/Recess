import type { WorkHistoryFact } from '@/modules/work-history';
import { selectFactsForWorkSessions, selectResolvedWorkSessionIds } from '../queryWindows';
import type { InsightResult, InsightWindow } from '../types';

export const FOCUS_RECOVERY_FORMULA_ID = 'focus-recovery-distribution';
export const FOCUS_RECOVERY_FORMULA_VERSION = 1;

export interface FocusRecoveryValue {
  focusPercent: number;
  recessPercent: number;
  focusSeconds: number;
  recessSeconds: number;
  sessionCount: number;
}

export const calculateFocusRecoveryDistribution = (
  facts: readonly WorkHistoryFact[],
  window: InsightWindow
): InsightResult<FocusRecoveryValue> => {
  const sessionIds = new Set(selectResolvedWorkSessionIds(facts, window));
  if (sessionIds.size === 0) {
    return { state: 'no-relevant-data', value: null, explanation: null };
  }

  const scoped = selectFactsForWorkSessions(facts, sessionIds);
  const focusSeconds = scoped
    .filter((fact) => fact.kind === 'focus-block-completed')
    .reduce((sum, fact) => sum + Number(fact.payload.actualFocusSeconds ?? 0), 0);
  const recessSeconds = scoped
    .filter((fact) => fact.kind === 'recess-completed')
    .reduce((sum, fact) => sum + Number(fact.payload.actualRecessSeconds ?? 0), 0);

  const denominator = focusSeconds + recessSeconds;
  if (denominator === 0) {
    return { state: 'no-relevant-data', value: null, explanation: null };
  }

  const focusPercent = (focusSeconds / denominator) * 100;
  const recessPercent = (recessSeconds / denominator) * 100;
  const sourceFactIds = scoped
    .filter((fact) => fact.kind === 'focus-block-completed' || fact.kind === 'recess-completed')
    .map((fact) => fact.id);

  return {
    state: 'calculated',
    value: {
      focusPercent,
      recessPercent,
      focusSeconds,
      recessSeconds,
      sessionCount: sessionIds.size,
    },
    explanation: {
      formulaId: FOCUS_RECOVERY_FORMULA_ID,
      formulaVersion: FOCUS_RECOVERY_FORMULA_VERSION,
      inputs: {
        focusSeconds,
        recessSeconds,
        sessionCount: sessionIds.size,
      },
      sourceFactIds,
    },
  };
};
