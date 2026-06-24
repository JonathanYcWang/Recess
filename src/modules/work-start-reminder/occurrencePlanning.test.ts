import { describe, expect, it } from 'vitest';
import {
  activateOccurrenceByAlarm,
  applyTimeZoneContext,
  computeNextOccurrenceEpochMs,
  createDefaultWorkStartReminderValue,
  decideAddSchedule,
  decideSkipNext,
  replanReminderOccurrences,
  workStartReminderAlarmName,
  type ReminderSchedule,
} from '@/modules/work-start-reminder';

const NEW_YORK = 'America/New_York';

const weekdaySchedule = (id: string, weekday: number): ReminderSchedule => ({
  id,
  localTime: { hour: 9, minute: 0 },
  weekdays: [
    weekday === 0,
    weekday === 1,
    weekday === 2,
    weekday === 3,
    weekday === 4,
    weekday === 5,
    weekday === 6,
  ],
  enabled: true,
});

describe('occurrence planning with time zones', () => {
  it('replaces future plans when the planning time zone changes', () => {
    const value = {
      ...createDefaultWorkStartReminderValue(),
      planningTimeZoneId: 'America/Los_Angeles',
      schedules: [weekdaySchedule('s1', 2)],
      occurrences: [
        {
          id: 'occ-old',
          scheduleId: 's1',
          scheduledEpochMs: Date.UTC(2026, 5, 24, 16, 0, 0),
          timeZoneId: 'America/Los_Angeles',
          phase: 'planned' as const,
          alarmName: 'work-start-reminder-occ-occ-old',
        },
      ],
    };

    const replanned = applyTimeZoneContext(value, NEW_YORK);
    expect(replanned.occurrences).toHaveLength(0);
    expect(replanned.planningTimeZoneId).toBe(NEW_YORK);
  });

  it('marks skip next neutral and plans the following occurrence', () => {
    let value = createDefaultWorkStartReminderValue();
    const added = decideAddSchedule(
      value,
      { time: '09:00 AM', weekdays: [false, true, true, true, true, true, false] },
      () => 'schedule-1'
    );
    expect(added.ok).toBe(true);
    if (!added.ok) {
      return;
    }
    value = replanReminderOccurrences(
      added.value,
      Date.UTC(2026, 5, 24, 12, 0, 0),
      () => 'occ-1',
      NEW_YORK
    );
    const skipped = decideSkipNext(value);
    expect(skipped.ok).toBe(true);
    if (!skipped.ok) {
      return;
    }
    const neutral = skipped.value.occurrences.find((occurrence) => occurrence.id === 'occ-1');
    expect(neutral).toMatchObject({ phase: 'resolved', outcome: 'neutral' });

    const replanned = replanReminderOccurrences(
      skipped.value,
      Date.UTC(2026, 5, 24, 12, 0, 0),
      () => 'occ-2',
      NEW_YORK
    );
    const planned = replanned.occurrences.filter((occurrence) => occurrence.phase === 'planned');
    expect(planned).toHaveLength(1);
    expect(planned[0]?.id).toBe('occ-2');
    expect(planned[0]?.scheduledEpochMs).toBeGreaterThan(Date.UTC(2026, 5, 24, 12, 0, 0));
  });

  it('allows repeated skip-next commands to neutralize successive planned occurrences', () => {
    let value = createDefaultWorkStartReminderValue();
    const added = decideAddSchedule(
      value,
      { time: '09:00 AM', weekdays: [true, true, true, true, true, true, true] },
      () => 'schedule-1'
    );
    if (!added.ok) {
      throw new Error('expected schedule');
    }
    value = replanReminderOccurrences(
      added.value,
      Date.UTC(2026, 5, 24, 12, 0, 0),
      () => 'occ-1',
      NEW_YORK
    );
    const firstSkip = decideSkipNext(value);
    if (!firstSkip.ok) {
      throw new Error('expected first skip');
    }
    value = replanReminderOccurrences(
      firstSkip.value,
      Date.UTC(2026, 5, 24, 12, 0, 0),
      () => 'occ-2',
      NEW_YORK
    );
    const secondSkip = decideSkipNext(value);
    expect(secondSkip.ok).toBe(true);
    if (!secondSkip.ok) {
      return;
    }
    expect(
      secondSkip.value.occurrences.filter(
        (occurrence) => occurrence.phase === 'resolved' && occurrence.outcome === 'neutral'
      )
    ).toHaveLength(2);
  });

  it('plans using the resolved zone rather than freezing a UTC offset', () => {
    const schedule = weekdaySchedule('s1', 3);
    const epoch = computeNextOccurrenceEpochMs(schedule, Date.UTC(2026, 5, 24, 12, 0, 0), NEW_YORK);
    expect(epoch).not.toBeNull();
  });

  it('ignores duplicate alarm activation for the same occurrence', () => {
    const value = {
      ...createDefaultWorkStartReminderValue(),
      schedules: [weekdaySchedule('s1', 2)],
      occurrences: [
        {
          id: 'occ-1',
          scheduleId: 's1',
          scheduledEpochMs: Date.UTC(2026, 5, 24, 16, 0, 0),
          timeZoneId: NEW_YORK,
          phase: 'planned' as const,
          alarmName: workStartReminderAlarmName('occ-1'),
        },
      ],
    };
    const first = activateOccurrenceByAlarm(value, workStartReminderAlarmName('occ-1'));
    const second = activateOccurrenceByAlarm(first.value, workStartReminderAlarmName('occ-1'));
    expect(first.occurrenceId).toBe('occ-1');
    expect(second.occurrenceId).toBeNull();
  });
});
