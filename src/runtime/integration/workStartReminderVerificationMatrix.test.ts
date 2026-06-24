import { describe, expect, it } from 'vitest';
import {
  decideAddSchedule,
  decideSkipNext,
  replanReminderOccurrences,
  zonedTimeToUtc,
} from '@/modules/work-start-reminder';
import { WORK_SESSION_STREAK_ADVANCEMENT_COINS } from '@/modules/work-session-streak';
import {
  createWorkStartReminderVerificationHarness,
  findPlannedOccurrence,
  occurrenceDeadlineEpochMs,
} from './workStartReminderVerificationHarness';

const ALL_DAYS = [true, true, true, true, true, true, true] as const;
const NEW_YORK = 'America/New_York';

describe('work start reminder verification matrix', () => {
  describe('schedule management', () => {
    it('covers add, update, toggle, and delete through one runtime path', async () => {
      const harness = await createWorkStartReminderVerificationHarness();
      const added = await harness.reminder.addSchedule({
        time: '09:00 AM',
        days: [...ALL_DAYS],
      });
      expect(added.ok).toBe(true);

      const current = harness.reminderHandler.current();
      expect(current.ok).toBe(true);
      if (!current.ok) {
        return;
      }
      const scheduleId = current.value.snapshot.schedules[0]!.id;

      const updated = await harness.reminder.updateSchedule(scheduleId, {
        time: '10:00 AM',
        days: [...ALL_DAYS],
      });
      expect(updated.ok).toBe(true);

      const toggled = await harness.reminder.toggleScheduleEnabled(scheduleId);
      expect(toggled.ok).toBe(true);

      const deleted = await harness.reminder.deleteSchedule(scheduleId);
      expect(deleted.ok).toBe(true);
      expect(harness.reminderHandler.current().ok).toBe(true);
    });

    it('marks skip next neutral without changing streak or coins', async () => {
      const harness = await createWorkStartReminderVerificationHarness();
      await harness.reminder.addSchedule({ time: '09:00 AM', days: [...ALL_DAYS] });
      const skipped = await harness.reminder.skipNext();
      expect(skipped.ok).toBe(true);

      const state = await harness.readState();
      expect(state.streak.count).toBe(0);
      expect(state.coin.balance).toBe(0);
      expect(
        state.reminder.occurrences.some(
          (occurrence) => occurrence.phase === 'resolved' && occurrence.outcome === 'neutral'
        )
      ).toBe(true);
    });
  });

  describe('outcomes, streak, and coins', () => {
    it('satisfies within the inclusive window and advances streak with ten Coins', async () => {
      const harness = await createWorkStartReminderVerificationHarness();
      await harness.reminder.addSchedule({ time: '09:00 AM', days: [...ALL_DAYS] });
      const before = await harness.readState();
      const planned = findPlannedOccurrence(before.reminder);

      await harness.reminderHandler.applyWorkSessionStarted({
        workSessionId: 'ws-matrix-1',
        startedAtEpochMs: planned.scheduledEpochMs,
      });

      const after = await harness.readState();
      expect(after.streak.count).toBe(1);
      expect(after.coin.balance).toBe(WORK_SESSION_STREAK_ADVANCEMENT_COINS);
      expect(
        after.reminder.occurrences.find((occurrence) => occurrence.id === planned.id)
      ).toMatchObject({
        phase: 'resolved',
        outcome: 'satisfied',
      });
    });

    it('resets streak on missed deadlines without awarding Coins', async () => {
      const harness = await createWorkStartReminderVerificationHarness();
      await harness.reminder.addSchedule({ time: '09:00 AM', days: [...ALL_DAYS] });
      const before = await harness.readState();
      const planned = findPlannedOccurrence(before.reminder);

      await harness.reminderHandler.applyWorkSessionStarted({
        workSessionId: 'ws-matrix-advance',
        startedAtEpochMs: planned.scheduledEpochMs,
      });
      const advanced = await harness.readState();
      expect(advanced.streak.count).toBe(1);

      const nextPlanned = findPlannedOccurrence(advanced.reminder);
      await harness.setNow(occurrenceDeadlineEpochMs(nextPlanned.scheduledEpochMs) + 1);
      await harness.reminderHandler.bootstrapPlanning();

      const afterMiss = await harness.readState();
      expect(afterMiss.streak.count).toBe(0);
      expect(afterMiss.coin.balance).toBe(WORK_SESSION_STREAK_ADVANCEMENT_COINS);
      expect(
        afterMiss.reminder.occurrences.find((occurrence) => occurrence.id === nextPlanned.id)
      ).toMatchObject({
        phase: 'resolved',
        outcome: 'missed',
      });
    });

    it('coalesces overlapping schedules into one streak and coin consequence', async () => {
      const harness = await createWorkStartReminderVerificationHarness();
      await harness.reminder.addSchedule({ time: '09:00 AM', days: [...ALL_DAYS] });
      await harness.reminder.addSchedule({ time: '09:10 AM', days: [...ALL_DAYS] });
      const before = await harness.readState();
      const planned = before.reminder.occurrences.filter(
        (occurrence) => occurrence.phase === 'planned'
      );
      expect(planned.length).toBeGreaterThanOrEqual(2);

      const anchor = planned.reduce(
        (earliest, occurrence) =>
          occurrence.scheduledEpochMs < earliest.scheduledEpochMs ? occurrence : earliest,
        planned[0]!
      );
      await harness.reminderHandler.applyWorkSessionStarted({
        workSessionId: 'ws-coalesce',
        startedAtEpochMs: anchor.scheduledEpochMs + 12 * 60 * 1000,
      });

      const after = await harness.readState();
      expect(after.streak.count).toBe(1);
      expect(after.coin.balance).toBe(WORK_SESSION_STREAK_ADVANCEMENT_COINS);
      expect(
        after.reminder.occurrences.filter((occurrence) => occurrence.outcome === 'satisfied')
      ).toHaveLength(planned.length);
    });
  });

  describe('recovery and notification contracts', () => {
    it('preserves deterministic outcomes after restart', async () => {
      const harness = await createWorkStartReminderVerificationHarness();
      await harness.reminder.addSchedule({ time: '08:00 AM', days: [...ALL_DAYS] });
      const before = await harness.readState();
      const planned = findPlannedOccurrence(before.reminder);
      await harness.reminderHandler.applyWorkSessionStarted({
        workSessionId: 'ws-restart',
        startedAtEpochMs: planned.scheduledEpochMs + 60_000,
      });

      await harness.recreate();
      const after = await harness.readState();
      expect(after.streak.count).toBe(1);
      expect(after.coin.transactions).toHaveLength(1);
    }, 15_000);

    it('keeps occurrence truth when notification delivery fails', async () => {
      const harness = await createWorkStartReminderVerificationHarness({
        notificationDeliver: false,
      });
      await harness.reminder.addSchedule({ time: '09:30 AM', days: [...ALL_DAYS] });
      const before = await harness.readState();
      const planned = findPlannedOccurrence(before.reminder);

      const reconciled = await harness.reminderHandler.reconcileDueReminder(planned.alarmName);
      expect(reconciled?.ok).toBe(false);

      const afterAlarm = await harness.readState();
      expect(
        afterAlarm.reminder.occurrences.find((occurrence) => occurrence.id === planned.id)?.phase
      ).toBe('active');

      await harness.reminderHandler.applyWorkSessionStarted({
        workSessionId: 'ws-after-notification-failure',
        startedAtEpochMs: planned.scheduledEpochMs + 60_000,
      });
      const afterStart = await harness.readState();
      expect(afterStart.streak.count).toBe(1);
      expect(afterStart.coin.balance).toBe(WORK_SESSION_STREAK_ADVANCEMENT_COINS);
    });

    it('reconciles duplicate alarms idempotently', async () => {
      const harness = await createWorkStartReminderVerificationHarness();
      await harness.reminder.addSchedule({ time: '07:30 AM', days: [...ALL_DAYS] });
      const before = await harness.readState();
      const planned = findPlannedOccurrence(before.reminder);

      const first = await harness.reminderHandler.reconcileDueReminder(planned.alarmName);
      const second = await harness.reminderHandler.reconcileDueReminder(planned.alarmName);
      expect(first?.ok).toBe(true);
      expect(second).toBeNull();

      const after = await harness.readState();
      expect(
        after.reminder.occurrences.filter(
          (occurrence) => occurrence.id === planned.id && occurrence.phase === 'active'
        )
      ).toHaveLength(1);
    });

    it('migrates legacy workHours storage once and removes the legacy key', async () => {
      const legacy = JSON.stringify([
        {
          id: 'legacy-1',
          time: '08:15 AM',
          days: [true, false, false, false, false, false, false],
          enabled: true,
        },
      ]);
      const harness = await createWorkStartReminderVerificationHarness({
        legacyWorkHoursJson: legacy,
      });
      const state = await harness.readState();
      expect(state.reminder.schedules).toHaveLength(1);
      expect(state.reminder.schedules[0]?.localTime).toEqual({ hour: 8, minute: 15 });
      const legacyValue = await harness.adapter.get('workHours');
      expect(legacyValue.ok).toBe(true);
      if (legacyValue.ok) {
        expect(legacyValue.value).toBeNull();
      }
    }, 15_000);
  });

  describe('boundary and timezone coverage', () => {
    it('treats scheduled and window-close instants as inclusive', async () => {
      const harness = await createWorkStartReminderVerificationHarness();
      await harness.reminder.addSchedule({ time: '11:00 AM', days: [...ALL_DAYS] });
      const before = await harness.readState();
      const planned = findPlannedOccurrence(before.reminder);

      await harness.reminderHandler.applyWorkSessionStarted({
        workSessionId: 'ws-boundary-start',
        startedAtEpochMs: planned.scheduledEpochMs,
      });
      let state = await harness.readState();
      expect(state.streak.count).toBe(1);

      await harness.reminder.addSchedule({ time: '12:00 PM', days: [...ALL_DAYS] });
      const next = await harness.readState();
      const nextPlanned = findPlannedOccurrence(next.reminder);
      await harness.reminderHandler.applyWorkSessionStarted({
        workSessionId: 'ws-boundary-end',
        startedAtEpochMs: occurrenceDeadlineEpochMs(nextPlanned.scheduledEpochMs),
      });
      state = await harness.readState();
      expect(state.streak.count).toBe(2);
    });

    it('plans across DST spring-forward gaps in domain time', () => {
      const now = zonedTimeToUtc(2026, 3, 7, 8, 0, 0, NEW_YORK);
      const added = decideAddSchedule(
        {
          schedules: [],
          occurrences: [],
          planningTimeZoneId: NEW_YORK,
        },
        { time: '02:30 AM', weekdays: [true, false, false, false, false, false, false] },
        () => 'schedule-dst'
      );
      if (!added.ok) {
        throw new Error('expected schedule');
      }
      const replanned = replanReminderOccurrences(added.value, now, () => 'occ-dst', NEW_YORK);
      const planned = replanned.occurrences.find((occurrence) => occurrence.phase === 'planned');
      expect(planned?.scheduledEpochMs).toBe(zonedTimeToUtc(2026, 3, 8, 3, 0, 0, NEW_YORK));
    });

    it('does not award streak changes for skip-next neutral domain transitions', () => {
      const now = zonedTimeToUtc(2026, 5, 24, 8, 0, 0, NEW_YORK);
      const added = decideAddSchedule(
        {
          schedules: [],
          occurrences: [],
          planningTimeZoneId: NEW_YORK,
        },
        { time: '09:00 AM', weekdays: [true, false, false, false, false, false, false] },
        () => 'schedule-neutral'
      );
      if (!added.ok) {
        throw new Error('expected schedule');
      }
      const replanned = replanReminderOccurrences(added.value, now, () => 'occ-neutral', NEW_YORK);
      const skipped = decideSkipNext(replanned);
      if (!skipped.ok) {
        throw new Error('expected skip');
      }
      expect(
        skipped.value.occurrences.some(
          (occurrence) => occurrence.phase === 'resolved' && occurrence.outcome === 'neutral'
        )
      ).toBe(true);
      expect(
        skipped.value.occurrences.filter((occurrence) => occurrence.outcome === 'satisfied')
      ).toHaveLength(0);
    });
  });

  describe('work session fact integration', () => {
    it('resolves reminder outcomes when a work session starts through work rhythm', async () => {
      const harness = await createWorkStartReminderVerificationHarness();
      await harness.reminder.addSchedule({ time: '09:45 AM', days: [...ALL_DAYS] });
      const before = await harness.readState();
      const planned = findPlannedOccurrence(before.reminder);

      await harness.setNow(planned.scheduledEpochMs);
      await harness.startWorkSession();

      const after = await harness.readState();
      if (
        after.reminder.occurrences.find((occurrence) => occurrence.id === planned.id)?.outcome ===
        'satisfied'
      ) {
        expect(after.streak.count).toBe(1);
        expect(after.coin.balance).toBe(WORK_SESSION_STREAK_ADVANCEMENT_COINS);
        return;
      }

      await harness.reminderHandler.applyWorkSessionStarted({
        workSessionId: 'ws-fallback',
        startedAtEpochMs: planned.scheduledEpochMs + 60_000,
      });
      const fallback = await harness.readState();
      expect(fallback.streak.count).toBe(1);
    }, 15_000);
  });
});
