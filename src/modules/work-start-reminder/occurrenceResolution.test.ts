import { describe, expect, it } from 'vitest';
import {
  buildCoalescingGroups,
  createDefaultWorkStartReminderValue,
  expireUnresolvedOccurrences,
  isWorkSessionStartWithinOccurrenceWindow,
  OCCURRENCE_ELIGIBILITY_WINDOW_MS,
  resolveOccurrencesOnWorkSessionStart,
  type ReminderOccurrence,
} from '@/modules/work-start-reminder';

const occurrence = (
  overrides: Partial<ReminderOccurrence> & Pick<ReminderOccurrence, 'id' | 'scheduledEpochMs'>
): ReminderOccurrence => ({
  scheduleId: overrides.scheduleId ?? 'schedule-1',
  timeZoneId: 'UTC',
  phase: overrides.phase ?? 'active',
  alarmName: `work-start-reminder-occ-${overrides.id}`,
  ...overrides,
});

describe('occurrenceResolution', () => {
  it('satisfies an occurrence when a work session starts within the inclusive window', () => {
    const scheduledEpochMs = 1_000_000;
    const value = {
      ...createDefaultWorkStartReminderValue(),
      occurrences: [occurrence({ id: 'occ-1', scheduledEpochMs, phase: 'active' })],
    };
    const resolved = resolveOccurrencesOnWorkSessionStart(value, {
      workSessionId: 'ws-1',
      startedAtEpochMs: scheduledEpochMs + 10 * 60 * 1000,
    });
    expect(resolved.resolvedOccurrenceIds).toEqual(['occ-1']);
    expect(resolved.value.occurrences[0]).toMatchObject({
      phase: 'resolved',
      outcome: 'satisfied',
      resolvedBySessionId: 'ws-1',
    });
  });

  it('does not satisfy when a work session starts before the scheduled instant', () => {
    const scheduledEpochMs = 1_000_000;
    const value = {
      ...createDefaultWorkStartReminderValue(),
      occurrences: [occurrence({ id: 'occ-1', scheduledEpochMs })],
    };
    const resolved = resolveOccurrencesOnWorkSessionStart(value, {
      workSessionId: 'ws-1',
      startedAtEpochMs: scheduledEpochMs - 1,
    });
    expect(resolved.resolvedOccurrenceIds).toEqual([]);
    expect(resolved.value.occurrences[0]?.phase).toBe('active');
  });

  it('does not satisfy when a work session starts after the window closes', () => {
    const scheduledEpochMs = 1_000_000;
    const value = {
      ...createDefaultWorkStartReminderValue(),
      occurrences: [occurrence({ id: 'occ-1', scheduledEpochMs })],
    };
    const resolved = resolveOccurrencesOnWorkSessionStart(value, {
      workSessionId: 'ws-1',
      startedAtEpochMs: scheduledEpochMs + OCCURRENCE_ELIGIBILITY_WINDOW_MS + 1,
    });
    expect(resolved.resolvedOccurrenceIds).toEqual([]);
  });

  it('marks unresolved occurrences missed once the coalesced deadline passes', () => {
    const scheduledEpochMs = 1_000_000;
    const value = {
      ...createDefaultWorkStartReminderValue(),
      occurrences: [occurrence({ id: 'occ-1', scheduledEpochMs, phase: 'planned' })],
    };
    const expired = expireUnresolvedOccurrences(
      value,
      scheduledEpochMs + OCCURRENCE_ELIGIBILITY_WINDOW_MS + 1
    );
    expect(expired.occurrences[0]).toMatchObject({
      phase: 'resolved',
      outcome: 'missed',
    });
  });

  it('coalesces overlapping windows and satisfies them together', () => {
    const first = 1_000_000;
    const second = first + 10 * 60 * 1000;
    const value = {
      ...createDefaultWorkStartReminderValue(),
      occurrences: [
        occurrence({ id: 'occ-1', scheduleId: 'schedule-1', scheduledEpochMs: first }),
        occurrence({ id: 'occ-2', scheduleId: 'schedule-2', scheduledEpochMs: second }),
      ],
    };
    expect(buildCoalescingGroups(value.occurrences)).toHaveLength(1);
    const resolved = resolveOccurrencesOnWorkSessionStart(value, {
      workSessionId: 'ws-1',
      startedAtEpochMs: second + 5 * 60 * 1000,
    });
    expect(resolved.resolvedOccurrenceIds.sort()).toEqual(['occ-1', 'occ-2']);
  });

  it('waits for the latest coalesced deadline before marking a group missed', () => {
    const first = 1_000_000;
    const second = first + 10 * 60 * 1000;
    const value = {
      ...createDefaultWorkStartReminderValue(),
      occurrences: [
        occurrence({ id: 'occ-1', scheduledEpochMs: first, phase: 'active' }),
        occurrence({ id: 'occ-2', scheduledEpochMs: second, phase: 'active' }),
      ],
    };
    const beforeSecondDeadline = expireUnresolvedOccurrences(
      value,
      second + OCCURRENCE_ELIGIBILITY_WINDOW_MS
    );
    expect(beforeSecondDeadline.occurrences.every((entry) => entry.phase === 'active')).toBe(true);

    const afterSecondDeadline = expireUnresolvedOccurrences(
      value,
      second + OCCURRENCE_ELIGIBILITY_WINDOW_MS + 1
    );
    expect(afterSecondDeadline.occurrences.every((entry) => entry.outcome === 'missed')).toBe(true);
  });

  it('ignores duplicate work session start replay for the same session id', () => {
    const scheduledEpochMs = 1_000_000;
    const value = {
      ...createDefaultWorkStartReminderValue(),
      occurrences: [occurrence({ id: 'occ-1', scheduledEpochMs })],
    };
    const first = resolveOccurrencesOnWorkSessionStart(value, {
      workSessionId: 'ws-1',
      startedAtEpochMs: scheduledEpochMs,
    });
    const second = resolveOccurrencesOnWorkSessionStart(first.value, {
      workSessionId: 'ws-1',
      startedAtEpochMs: scheduledEpochMs + 60_000,
    });
    expect(second.resolvedOccurrenceIds).toEqual([]);
    expect(second.value.occurrences.filter((entry) => entry.outcome === 'satisfied')).toHaveLength(
      1
    );
  });

  it('treats inclusive window boundaries as eligible', () => {
    const scheduledEpochMs = 1_000_000;
    const occurrenceEntry = occurrence({ id: 'occ-1', scheduledEpochMs });
    expect(isWorkSessionStartWithinOccurrenceWindow(occurrenceEntry, scheduledEpochMs)).toBe(true);
    expect(
      isWorkSessionStartWithinOccurrenceWindow(
        occurrenceEntry,
        scheduledEpochMs + OCCURRENCE_ELIGIBILITY_WINDOW_MS
      )
    ).toBe(true);
  });
});
