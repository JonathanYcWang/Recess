import { describe, expect, it } from 'vitest';
import {
  createDefaultWorkStartReminderValue,
  decideAddSchedule,
  decideDeleteSchedule,
  decideToggleScheduleEnabled,
  decideUpdateSchedule,
  recalculateScheduleOccurrences,
  replanReminderOccurrences,
  resolveTodayInstantForSchedule,
  zonedTimeToUtc,
} from '@/modules/work-start-reminder';

const NEW_YORK = 'America/New_York';

const seedSundaySchedule = (nowEpochMs: number) => {
  const value = createDefaultWorkStartReminderValue();
  const added = decideAddSchedule(
    value,
    { time: '09:00 AM', weekdays: [true, false, false, false, false, false, false] },
    () => 'schedule-1'
  );
  if (!added.ok) {
    throw new Error('expected schedule');
  }
  const replanned = replanReminderOccurrences(
    added.value,
    nowEpochMs,
    () => 'occ-initial',
    NEW_YORK
  );
  return recalculateScheduleOccurrences(
    replanned,
    'schedule-1',
    nowEpochMs,
    NEW_YORK,
    () => 'occ-1'
  );
};

describe('occurrenceRecalculation', () => {
  it('replaces a same-day plan when editing to a later time today', () => {
    const now = zonedTimeToUtc(2026, 5, 24, 8, 0, 0, NEW_YORK);
    const value = seedSundaySchedule(now);
    const updated = decideUpdateSchedule(value, 'schedule-1', {
      time: '11:00 AM',
      weekdays: [true, false, false, false, false, false, false],
    });
    if (!updated.ok) {
      throw new Error('expected update');
    }
    const recalculated = recalculateScheduleOccurrences(
      updated.value,
      'schedule-1',
      now,
      NEW_YORK,
      () => 'occ-later'
    );
    const todayInstant = resolveTodayInstantForSchedule(recalculated.schedules[0]!, now, NEW_YORK);
    const planned = recalculated.occurrences.find((occurrence) => occurrence.phase === 'planned');
    expect(planned?.scheduledEpochMs).toBe(todayInstant);
    expect(planned?.scheduledEpochMs).toBeGreaterThan(now);
  });

  it('creates an active occurrence when editing into the preceding fifteen-minute window', () => {
    const scheduled = zonedTimeToUtc(2026, 5, 24, 9, 0, 0, NEW_YORK);
    const now = scheduled - 10 * 60 * 1000;
    const value = seedSundaySchedule(now);
    const updated = decideUpdateSchedule(value, 'schedule-1', {
      time: '09:00 AM',
      weekdays: [true, false, false, false, false, false, false],
    });
    if (!updated.ok) {
      throw new Error('expected update');
    }
    const recalculated = recalculateScheduleOccurrences(
      updated.value,
      'schedule-1',
      now,
      NEW_YORK,
      () => 'occ-active'
    );
    expect(recalculated.occurrences.some((occurrence) => occurrence.phase === 'active')).toBe(true);
  });

  it('resolves missed when editing to more than fifteen minutes in the past', () => {
    const scheduled = zonedTimeToUtc(2026, 5, 24, 9, 0, 0, NEW_YORK);
    const now = scheduled + 20 * 60 * 1000;
    const value = seedSundaySchedule(now);
    const updated = decideUpdateSchedule(value, 'schedule-1', {
      time: '09:00 AM',
      weekdays: [true, false, false, false, false, false, false],
    });
    if (!updated.ok) {
      throw new Error('expected update');
    }
    const recalculated = recalculateScheduleOccurrences(
      updated.value,
      'schedule-1',
      now,
      NEW_YORK,
      () => 'occ-missed'
    );
    expect(recalculated.occurrences).toContainEqual(
      expect.objectContaining({ phase: 'resolved', outcome: 'missed' })
    );
  });

  it('neutralizes today open occurrences when disabling or deleting a schedule', () => {
    const now = zonedTimeToUtc(2026, 5, 24, 8, 50, 0, NEW_YORK);
    const value = seedSundaySchedule(now);
    const disabled = decideToggleScheduleEnabled(value, 'schedule-1');
    if (!disabled.ok) {
      throw new Error('expected toggle');
    }
    const recalculated = recalculateScheduleOccurrences(
      disabled.value,
      'schedule-1',
      now,
      NEW_YORK,
      () => 'occ-neutral'
    );
    expect(recalculated.occurrences).toContainEqual(
      expect.objectContaining({ phase: 'resolved', outcome: 'neutral' })
    );

    const deleted = decideDeleteSchedule(value, 'schedule-1', {
      nowEpochMs: now,
      timeZoneId: NEW_YORK,
    });
    if (!deleted.ok) {
      throw new Error('expected delete');
    }
    expect(deleted.value.schedules).toHaveLength(0);
    expect(deleted.value.occurrences).toContainEqual(
      expect.objectContaining({ phase: 'resolved', outcome: 'neutral' })
    );
  });
});
