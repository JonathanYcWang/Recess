import type { WorkHistoryFact } from '@/modules/work-history';
import { selectReminderOccurrenceFacts } from '../queryWindows';
import type { InsightResult, InsightWindow } from '../types';

export const REMINDER_ADHERENCE_FORMULA_ID = 'reminder-adherence';
export const REMINDER_ADHERENCE_FORMULA_VERSION = 1;

export interface ReminderAdherenceValue {
  adherencePercent: number;
  satisfiedCount: number;
  missedCount: number;
  occurrenceCount: number;
}

export const calculateReminderAdherence = (
  facts: readonly WorkHistoryFact[],
  window: InsightWindow
): InsightResult<ReminderAdherenceValue> => {
  const occurrences = selectReminderOccurrenceFacts(facts, window);
  if (occurrences.length === 0) {
    return { state: 'no-relevant-data', value: null, explanation: null };
  }

  const satisfiedCount = occurrences.filter((fact) => fact.payload.outcome === 'satisfied').length;
  const missedCount = occurrences.filter((fact) => fact.payload.outcome === 'missed').length;
  const denominator = satisfiedCount + missedCount;
  const adherencePercent = denominator === 0 ? 0 : (satisfiedCount / denominator) * 100;

  return {
    state: 'calculated',
    value: {
      adherencePercent,
      satisfiedCount,
      missedCount,
      occurrenceCount: occurrences.length,
    },
    explanation: {
      formulaId: REMINDER_ADHERENCE_FORMULA_ID,
      formulaVersion: REMINDER_ADHERENCE_FORMULA_VERSION,
      inputs: {
        satisfiedCount,
        missedCount,
        occurrenceCount: occurrences.length,
      },
      sourceFactIds: occurrences.map((fact) => fact.id),
    },
  };
};
