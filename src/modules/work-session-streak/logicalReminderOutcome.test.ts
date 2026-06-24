import { describe, expect, it } from 'vitest';
import { createDefaultWorkStartReminderValue } from '@/modules/work-start-reminder';
import {
  extractNewLogicalReminderOutcomes,
  groupOccurrencesIntoLogicalOutcomes,
  logicalReminderOutcomeId,
  pendingLogicalReminderOutcomes,
  createDefaultWorkSessionStreakValue,
} from '@/modules/work-session-streak';

describe('logicalReminderOutcome', () => {
  it('groups coalesced occurrences into one logical outcome id', () => {
    const outcomes = groupOccurrencesIntoLogicalOutcomes([
      {
        id: 'occ-2',
        scheduleId: 'schedule-2',
        scheduledEpochMs: 2_000,
        timeZoneId: 'UTC',
        phase: 'resolved',
        outcome: 'satisfied',
        resolvedAtEpochMs: 2_100,
        resolvedBySessionId: 'ws-1',
        alarmName: 'work-start-reminder-occ-occ-2',
      },
      {
        id: 'occ-1',
        scheduleId: 'schedule-1',
        scheduledEpochMs: 1_000,
        timeZoneId: 'UTC',
        phase: 'resolved',
        outcome: 'satisfied',
        resolvedAtEpochMs: 2_100,
        resolvedBySessionId: 'ws-1',
        alarmName: 'work-start-reminder-occ-occ-1',
      },
    ]);
    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]?.logicalOutcomeId).toBe(logicalReminderOutcomeId(['occ-1', 'occ-2']));
    expect([...outcomes[0]!.occurrenceIds].sort()).toEqual(['occ-1', 'occ-2']);
  });

  it('extracts only newly resolved logical outcomes from a reminder transition', () => {
    const before = createDefaultWorkStartReminderValue();
    const after = {
      ...createDefaultWorkStartReminderValue(),
      occurrences: [
        {
          id: 'occ-1',
          scheduleId: 'schedule-1',
          scheduledEpochMs: 1_000,
          timeZoneId: 'UTC',
          phase: 'resolved' as const,
          outcome: 'satisfied' as const,
          resolvedAtEpochMs: 1_100,
          resolvedBySessionId: 'ws-1',
          alarmName: 'work-start-reminder-occ-occ-1',
        },
      ],
    };
    expect(extractNewLogicalReminderOutcomes(before, after)).toHaveLength(1);
    expect(extractNewLogicalReminderOutcomes(after, after)).toHaveLength(0);
  });

  it('finds pending outcomes during restart reconciliation', () => {
    const reminder = {
      ...createDefaultWorkStartReminderValue(),
      occurrences: [
        {
          id: 'occ-1',
          scheduleId: 'schedule-1',
          scheduledEpochMs: 1_000,
          timeZoneId: 'UTC',
          phase: 'resolved' as const,
          outcome: 'missed' as const,
          resolvedAtEpochMs: 2_000,
          alarmName: 'work-start-reminder-occ-occ-1',
        },
      ],
    };
    expect(pendingLogicalReminderOutcomes(createDefaultWorkSessionStreakValue(), reminder)).toEqual(
      [
        {
          logicalOutcomeId: 'occ-1',
          occurrenceIds: ['occ-1'],
          outcome: 'missed',
          resolvedAtEpochMs: 2_000,
          workSessionId: undefined,
        },
      ]
    );
  });
});
