import { describe, expect, it } from 'vitest';
import { createInMemoryKeyValueAdapter } from '@/adapters/browser/in-memory/inMemoryKeyValueAdapter';
import { createBackgroundCompositionRoot } from '@/runtime/background/backgroundCompositionRoot';

describe('workStartReminderCommandHandler', () => {
  it('adds and toggles schedules through one handler path', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const root = await createBackgroundCompositionRoot({ adapter });
    if (!root.ok) {
      throw new Error('expected root');
    }

    const added = await root.value.workStartReminder.addSchedule({
      time: '09:00 AM',
      days: [false, true, true, true, true, true, false],
    });
    expect(added.ok).toBe(true);

    const current = root.value.workStartReminderHandler.current();
    expect(current.ok).toBe(true);
    if (!current.ok) {
      return;
    }
    expect(current.value.snapshot.schedules).toHaveLength(1);

    const toggled = await root.value.workStartReminder.toggleScheduleEnabled(
      current.value.snapshot.schedules[0]!.id
    );
    expect(toggled.ok).toBe(true);
  });

  it('reconstructs schedules after restart', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const firstRoot = await createBackgroundCompositionRoot({ adapter });
    if (!firstRoot.ok) {
      throw new Error('expected root');
    }
    await firstRoot.value.workStartReminder.addSchedule({
      time: '08:30 AM',
      days: [true, false, false, false, false, false, false],
    });

    const secondRoot = await createBackgroundCompositionRoot({ adapter });
    if (!secondRoot.ok) {
      throw new Error('expected root');
    }
    const current = secondRoot.value.workStartReminderHandler.current();
    expect(current.ok).toBe(true);
    if (!current.ok) {
      return;
    }
    expect(current.value.snapshot.schedules).toHaveLength(1);
  });

  it('skip next neutralizes the soonest planned occurrence and replans', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const root = await createBackgroundCompositionRoot({ adapter });
    if (!root.ok) {
      throw new Error('expected root');
    }
    await root.value.workStartReminder.addSchedule({
      time: '09:00 AM',
      days: [false, true, true, true, true, true, false],
    });
    const before = root.value.workStartReminderHandler.current();
    if (!before.ok) {
      throw new Error('expected current');
    }
    const skipped = await root.value.workStartReminder.skipNext();
    expect(skipped.ok).toBe(true);
    const after = root.value.workStartReminderHandler.current();
    expect(after.ok).toBe(true);
    if (!after.ok) {
      return;
    }
    expect(after.value.revision).toBeGreaterThan(before.value.revision);
  });
});
