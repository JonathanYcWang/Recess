import { describe, expect, it } from 'vitest';
import { createInMemoryKeyValueAdapter } from '@/adapters/browser/in-memory/inMemoryKeyValueAdapter';
import { createPersistedApplicationState } from '@/runtime/persistence';
import { createBackgroundCompositionRoot } from '@/runtime/background/backgroundCompositionRoot';

const allDays = [true, true, true, true, true, true, true] as const;

const readReminderOccurrences = async (
  adapter: ReturnType<typeof createInMemoryKeyValueAdapter>
) => {
  const persistence = createPersistedApplicationState({ adapter });
  const document = await persistence.read('work-start-reminder');
  if (!document.ok) {
    throw new Error('expected reminder document');
  }
  return document.value.value.occurrences;
};

describe('workStartReminder occurrence resolution integration', () => {
  it('satisfies a planned occurrence when applyWorkSessionStarted runs within the window', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const root = await createBackgroundCompositionRoot({ adapter });
    if (!root.ok) {
      throw new Error('expected root');
    }

    await root.value.workStartReminder.addSchedule({
      time: '09:00 AM',
      days: [...allDays],
    });

    const planned = (await readReminderOccurrences(adapter)).find(
      (occurrence) => occurrence.phase === 'planned'
    );
    if (!planned) {
      throw new Error('expected planned occurrence');
    }

    const resolved = await root.value.workStartReminderHandler.applyWorkSessionStarted({
      workSessionId: 'ws-1',
      startedAtEpochMs: planned.scheduledEpochMs + 60_000,
    });
    expect(resolved.ok).toBe(true);

    const occurrence = (await readReminderOccurrences(adapter)).find(
      (entry) => entry.id === planned.id
    );
    expect(occurrence).toMatchObject({
      phase: 'resolved',
      outcome: 'satisfied',
      resolvedBySessionId: 'ws-1',
    });
  });

  it('preserves satisfied occurrences after restart and ignores duplicate replay', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const firstRoot = await createBackgroundCompositionRoot({ adapter });
    if (!firstRoot.ok) {
      throw new Error('expected root');
    }

    await firstRoot.value.workStartReminder.addSchedule({
      time: '10:00 AM',
      days: [...allDays],
    });

    const planned = (await readReminderOccurrences(adapter)).find(
      (occurrence) => occurrence.phase === 'planned'
    );
    if (!planned) {
      throw new Error('expected planned occurrence');
    }

    await firstRoot.value.workStartReminderHandler.applyWorkSessionStarted({
      workSessionId: 'ws-replay',
      startedAtEpochMs: planned.scheduledEpochMs,
    });

    const secondRoot = await createBackgroundCompositionRoot({ adapter });
    if (!secondRoot.ok) {
      throw new Error('expected restart root');
    }

    const afterRestart = (await readReminderOccurrences(adapter)).find(
      (occurrence) => occurrence.id === planned.id
    );
    expect(afterRestart).toMatchObject({
      phase: 'resolved',
      outcome: 'satisfied',
      resolvedBySessionId: 'ws-replay',
    });

    await secondRoot.value.workStartReminderHandler.applyWorkSessionStarted({
      workSessionId: 'ws-replay',
      startedAtEpochMs: planned.scheduledEpochMs + 60_000,
    });

    const afterDuplicate = (await readReminderOccurrences(adapter)).filter(
      (occurrence) => occurrence.outcome === 'satisfied' && occurrence.id === planned.id
    );
    expect(afterDuplicate).toHaveLength(1);
  }, 15_000);
});
