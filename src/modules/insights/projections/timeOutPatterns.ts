import type { WorkHistoryFact } from '@/modules/work-history';
import { selectFactsForWorkSessions, selectResolvedWorkSessionIds } from '../queryWindows';
import type { InsightResult, InsightWindow } from '../types';

export const TIME_OUT_PATTERNS_FORMULA_ID = 'time-out-patterns';
export const TIME_OUT_PATTERNS_FORMULA_VERSION = 1;

export interface TimeOutPatternsValue {
  count: number;
  totalSeconds: number;
  averageSeconds: number;
  sessionsWithTimeOutPercent: number;
  resolvedSessionCount: number;
}

export const calculateTimeOutPatterns = (
  facts: readonly WorkHistoryFact[],
  window: InsightWindow
): InsightResult<TimeOutPatternsValue> => {
  const sessionIds = selectResolvedWorkSessionIds(facts, window);
  if (sessionIds.length === 0) {
    return { state: 'no-relevant-data', value: null, explanation: null };
  }

  const scoped = selectFactsForWorkSessions(facts, new Set(sessionIds));
  const endedFacts = scoped.filter((fact) => fact.kind === 'time-out-ended');
  const durations = endedFacts.map((fact) => Number(fact.payload.durationSeconds ?? 0));
  const totalSeconds = durations.reduce((sum, value) => sum + value, 0);
  const sessionsWithTimeOut = new Set(endedFacts.map((fact) => String(fact.payload.workSessionId)))
    .size;

  if (endedFacts.length === 0) {
    return {
      state: 'explicit-zero',
      value: {
        count: 0,
        totalSeconds: 0,
        averageSeconds: 0,
        sessionsWithTimeOutPercent: 0,
        resolvedSessionCount: sessionIds.length,
      },
      explanation: {
        formulaId: TIME_OUT_PATTERNS_FORMULA_ID,
        formulaVersion: TIME_OUT_PATTERNS_FORMULA_VERSION,
        inputs: {
          resolvedSessionCount: sessionIds.length,
          timeOutCount: 0,
        },
        sourceFactIds: scoped
          .filter((fact) => fact.kind === 'work-session-completed')
          .map((fact) => fact.id),
      },
    };
  }

  return {
    state: 'calculated',
    value: {
      count: endedFacts.length,
      totalSeconds,
      averageSeconds: totalSeconds / endedFacts.length,
      sessionsWithTimeOutPercent: (sessionsWithTimeOut / sessionIds.length) * 100,
      resolvedSessionCount: sessionIds.length,
    },
    explanation: {
      formulaId: TIME_OUT_PATTERNS_FORMULA_ID,
      formulaVersion: TIME_OUT_PATTERNS_FORMULA_VERSION,
      inputs: {
        timeOutCount: endedFacts.length,
        totalSeconds,
        resolvedSessionCount: sessionIds.length,
      },
      sourceFactIds: endedFacts.map((fact) => fact.id),
    },
  };
};
