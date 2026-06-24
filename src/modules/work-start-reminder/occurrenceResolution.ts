import type { ReminderOccurrence, WorkStartReminderValue } from './workStartReminderDocument';
import { OCCURRENCE_ELIGIBILITY_WINDOW_MS } from './occurrenceRecalculation';
import { cloneWorkStartReminderValue } from './occurrencePlanning';

export const occurrenceWindowEndEpochMs = (scheduledEpochMs: number): number =>
  scheduledEpochMs + OCCURRENCE_ELIGIBILITY_WINDOW_MS;

export const isOpenOccurrence = (occurrence: ReminderOccurrence): boolean =>
  occurrence.phase === 'planned' || occurrence.phase === 'active';

export const isWorkSessionStartWithinOccurrenceWindow = (
  occurrence: ReminderOccurrence,
  workSessionStartedAtEpochMs: number
): boolean =>
  workSessionStartedAtEpochMs >= occurrence.scheduledEpochMs &&
  workSessionStartedAtEpochMs <= occurrenceWindowEndEpochMs(occurrence.scheduledEpochMs);

export const buildCoalescingGroups = (
  occurrences: readonly ReminderOccurrence[]
): ReminderOccurrence[][] => {
  const open = occurrences.filter(isOpenOccurrence);
  if (open.length === 0) {
    return [];
  }

  const sorted = [...open].sort((left, right) => left.scheduledEpochMs - right.scheduledEpochMs);
  const groups: ReminderOccurrence[][] = [];
  let current: ReminderOccurrence[] = [sorted[0]!];
  let groupEnd = occurrenceWindowEndEpochMs(sorted[0]!.scheduledEpochMs);

  for (let index = 1; index < sorted.length; index += 1) {
    const occurrence = sorted[index]!;
    const occurrenceEnd = occurrenceWindowEndEpochMs(occurrence.scheduledEpochMs);
    if (occurrence.scheduledEpochMs <= groupEnd) {
      current.push(occurrence);
      groupEnd = Math.max(groupEnd, occurrenceEnd);
      continue;
    }
    groups.push(current);
    current = [occurrence];
    groupEnd = occurrenceEnd;
  }
  groups.push(current);
  return groups;
};

export const coalescingGroupDeadlineEpochMs = (group: readonly ReminderOccurrence[]): number =>
  Math.max(...group.map((occurrence) => occurrenceWindowEndEpochMs(occurrence.scheduledEpochMs)));

const resolveOccurrenceIds = (
  value: WorkStartReminderValue,
  occurrenceIds: ReadonlySet<string>,
  resolution: {
    outcome: 'satisfied' | 'missed';
    resolvedAtEpochMs: number;
    resolvedBySessionId?: string;
  }
): WorkStartReminderValue => {
  const next = cloneWorkStartReminderValue(value);
  next.occurrences = next.occurrences.map((occurrence) =>
    occurrenceIds.has(occurrence.id)
      ? {
          ...occurrence,
          phase: 'resolved' as const,
          outcome: resolution.outcome,
          resolvedAtEpochMs: resolution.resolvedAtEpochMs,
          resolvedBySessionId: resolution.resolvedBySessionId,
        }
      : occurrence
  );
  return next;
};

export const resolveOccurrencesOnWorkSessionStart = (
  value: WorkStartReminderValue,
  input: { workSessionId: string; startedAtEpochMs: number }
): { value: WorkStartReminderValue; resolvedOccurrenceIds: string[] } => {
  if (
    value.occurrences.some(
      (occurrence) =>
        occurrence.phase === 'resolved' &&
        occurrence.outcome === 'satisfied' &&
        occurrence.resolvedBySessionId === input.workSessionId
    )
  ) {
    return { value, resolvedOccurrenceIds: [] };
  }

  const groups = buildCoalescingGroups(value.occurrences);
  const matchingGroup = groups.find((group) =>
    group.some((occurrence) =>
      isWorkSessionStartWithinOccurrenceWindow(occurrence, input.startedAtEpochMs)
    )
  );
  if (!matchingGroup) {
    return { value, resolvedOccurrenceIds: [] };
  }

  const occurrenceIds = new Set(matchingGroup.map((occurrence) => occurrence.id));
  return {
    value: resolveOccurrenceIds(value, occurrenceIds, {
      outcome: 'satisfied',
      resolvedAtEpochMs: input.startedAtEpochMs,
      resolvedBySessionId: input.workSessionId,
    }),
    resolvedOccurrenceIds: [...occurrenceIds],
  };
};

export const expireUnresolvedOccurrences = (
  value: WorkStartReminderValue,
  nowEpochMs: number
): WorkStartReminderValue => {
  const groups = buildCoalescingGroups(value.occurrences);
  const toMiss = new Set<string>();
  for (const group of groups) {
    if (nowEpochMs > coalescingGroupDeadlineEpochMs(group)) {
      for (const occurrence of group) {
        toMiss.add(occurrence.id);
      }
    }
  }
  if (toMiss.size === 0) {
    return value;
  }
  return resolveOccurrenceIds(value, toMiss, {
    outcome: 'missed',
    resolvedAtEpochMs: nowEpochMs,
  });
};

export const applyOccurrenceResolution = (
  value: WorkStartReminderValue,
  nowEpochMs: number,
  workSessionStart?: { workSessionId: string; startedAtEpochMs: number }
): WorkStartReminderValue => {
  let next = value;
  if (workSessionStart) {
    next = resolveOccurrencesOnWorkSessionStart(next, workSessionStart).value;
  }
  return expireUnresolvedOccurrences(next, nowEpochMs);
};
