import { describe, expect, it } from 'vitest';
import {
  computeNextOccurrenceEpochMs,
  decideAddSchedule,
  parseDisplayTimeString,
  replanReminderOccurrences,
  workStartReminderAlarmName,
  createDefaultWorkStartReminderValue,
} from '@/modules/work-start-reminder';

describe('work-start-reminder domain', () => {
  it('parses and validates display time strings', () => {
    expect(parseDisplayTimeString('09:00 AM')).toEqual({
      ok: true,
      value: { hour: 9, minute: 0 },
    });
    expect(parseDisplayTimeString('bad')).toEqual({ ok: false, error: { kind: 'invalid-format' } });
  });

  it('adds schedules with stable ids and plans the next occurrence', () => {
    const now = Date.UTC(2026, 5, 24, 12, 0, 0);
    const added = decideAddSchedule(
      createDefaultWorkStartReminderValue(),
      {
        time: '09:00 AM',
        weekdays: [false, true, true, true, true, true, false],
      },
      () => 'schedule-1'
    );
    expect(added.ok).toBe(true);
    if (!added.ok) {
      return;
    }
    const replanned = replanReminderOccurrences(added.value, now, () => 'occ-1');
    expect(replanned.occurrences).toHaveLength(1);
    expect(replanned.occurrences[0]?.scheduleId).toBe('schedule-1');
    expect(replanned.occurrences[0]?.alarmName).toBe(workStartReminderAlarmName('occ-1'));
    expect(computeNextOccurrenceEpochMs(replanned.schedules[0]!, now, 'UTC')! > now).toBe(true);
  });
});
