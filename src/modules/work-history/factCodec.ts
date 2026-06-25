import type { WorkHistoryFact, WorkHistoryFactKind } from './types';

export const WORK_HISTORY_FACT_SCHEMA_VERSION = 1;

export const WORK_HISTORY_FACT_KINDS: readonly WorkHistoryFactKind[] = [
  'work-session-started',
  'work-session-completed',
  'work-session-extended',
  'focus-block-completed',
  'recess-started',
  'recess-completed',
  'time-out-started',
  'time-out-ended',
  'task-focused-time-attributed',
  'task-completed',
  'reminder-occurrence-resolved',
];

const isWorkHistoryFactKind = (value: string): value is WorkHistoryFactKind =>
  (WORK_HISTORY_FACT_KINDS as readonly string[]).includes(value);

export const workHistoryFactToEffectFacts = (fact: WorkHistoryFact): Record<string, string> => {
  const facts: Record<string, string> = {
    factId: fact.id,
    recordedAt: String(fact.recordedAt),
    kind: fact.kind,
    schemaVersion: String(WORK_HISTORY_FACT_SCHEMA_VERSION),
  };
  for (const [key, value] of Object.entries(fact.payload)) {
    if (value === null) {
      facts[key] = 'null';
    } else {
      facts[key] = String(value);
    }
  }
  return facts;
};

export const effectFactsToWorkHistoryFact = (
  facts: Record<string, string>
): WorkHistoryFact | null => {
  const factId = facts.factId;
  const recordedAt = Number(facts.recordedAt);
  const kind = facts.kind;
  if (!factId || !Number.isFinite(recordedAt) || !kind || !isWorkHistoryFactKind(kind)) {
    return null;
  }

  const payload: WorkHistoryFact['payload'] = {};
  const schemaVersion = Number(facts.schemaVersion);
  if (Number.isFinite(schemaVersion)) {
    payload.schemaVersion = schemaVersion;
  }
  for (const [key, value] of Object.entries(facts)) {
    if (key === 'factId' || key === 'recordedAt' || key === 'kind' || key === 'schemaVersion') {
      continue;
    }
    if (value === 'true') {
      payload[key] = true;
    } else if (value === 'false') {
      payload[key] = false;
    } else if (value === 'null') {
      payload[key] = null;
    } else {
      const numeric = Number(value);
      payload[key] = Number.isFinite(numeric) && value.trim() !== '' ? numeric : value;
    }
  }

  return {
    id: factId,
    recordedAt,
    kind,
    payload,
  };
};

export const withSchemaVersion = (fact: WorkHistoryFact): WorkHistoryFact => ({
  ...fact,
  payload: {
    schemaVersion: WORK_HISTORY_FACT_SCHEMA_VERSION,
    ...fact.payload,
  },
});
