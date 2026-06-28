import { describe, expect, it } from 'vitest';
import { createInMemoryKeyValueAdapter } from '@/adapters/browser/in-memory/inMemoryKeyValueAdapter';
import { createPersistedApplicationState } from '@/modules/persisted-application-state';
import type { WorkRhythmFocusBlock } from '@/modules/work-rhythm';
import { createBackgroundCompositionRoot } from '@/runtime/background/backgroundCompositionRoot';
import { createWorkRhythmCommandEnvelope } from '@/runtime/client/inProcessWorkRhythmClient';

const readFocusDocument = async (
  adapter: ReturnType<typeof createInMemoryKeyValueAdapter>
): Promise<WorkRhythmFocusBlock> => {
  const persistence = createPersistedApplicationState({ adapter });
  const initialized = await persistence.initialize();
  if (!initialized.ok || initialized.value.documents['work-rhythm'].value.phase !== 'focus-block') {
    throw new Error('expected focus-block document');
  }
  return initialized.value.documents['work-rhythm'].value;
};

describe('work rhythm task cap integration', () => {
  it('caps the first focus block from confirmed planner task remaining work', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const root = await createBackgroundCompositionRoot({ adapter });
    if (!root.ok) {
      throw new Error('expected root');
    }

    const created = await root.value.taskList.createTask({
      title: 'Spec draft',
      originalEstimateMinutes: 15,
    });
    if (!created.ok) {
      throw new Error('expected task');
    }
    const taskId = created.snapshot.snapshot.incompleteTasks[0]?.id;
    if (!taskId) {
      throw new Error('expected task id');
    }
    const started = await root.value.workRhythm.command(
      createWorkRhythmCommandEnvelope({
        kind: 'start-work-session',
        goalSeconds: 3 * 60 * 60,
        energy: 'steady',
      })
    );
    expect(started.ok).toBe(true);
    const focus = await readFocusDocument(adapter);

    expect(focus.focusDurationSeconds).toBe(15 * 60);
    expect(focus.schedulerReasons.map((reason) => reason.code)).toContain('task-cap');
    expect(focus.selectedTaskIds).toEqual([taskId]);
  });

  it('ignores stale planner selections for completed tasks', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const root = await createBackgroundCompositionRoot({ adapter });
    if (!root.ok) {
      throw new Error('expected root');
    }

    const created = await root.value.taskList.createTask({
      title: 'Ship fix',
      originalEstimateMinutes: 30,
    });
    if (!created.ok) {
      throw new Error('expected task');
    }
    const taskId = created.snapshot.snapshot.incompleteTasks[0]?.id;
    if (!taskId) {
      throw new Error('expected task id');
    }

    const completed = await root.value.taskList.completeTask(taskId);
    expect(completed.ok).toBe(true);
    const started = await root.value.workRhythm.command(
      createWorkRhythmCommandEnvelope({
        kind: 'start-work-session',
        goalSeconds: 3 * 60 * 60,
        energy: 'steady',
      })
    );
    expect(started.ok).toBe(true);
    const focus = await readFocusDocument(adapter);

    expect(focus.focusDurationSeconds).toBe(25 * 60);
    expect(focus.schedulerReasons.map((reason) => reason.code)).not.toContain('task-cap');
    expect(focus.selectedTaskIds).toEqual([]);
  });

  it('does not retroactively change an active focus deadline when tasks are edited', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const root = await createBackgroundCompositionRoot({ adapter });
    if (!root.ok) {
      throw new Error('expected root');
    }

    const first = await root.value.taskList.createTask({
      title: 'First',
      originalEstimateMinutes: 15,
    });
    const second = await root.value.taskList.createTask({
      title: 'Second',
      originalEstimateMinutes: 30,
    });
    if (!first.ok || !second.ok) {
      throw new Error('expected tasks');
    }
    const firstId = first.snapshot.snapshot.incompleteTasks.find(
      (task) => task.title === 'First'
    )?.id;
    const secondId = second.snapshot.snapshot.incompleteTasks.find(
      (task) => task.title === 'Second'
    )?.id;
    if (!firstId || !secondId) {
      throw new Error('expected task ids');
    }
    const started = await root.value.workRhythm.command(
      createWorkRhythmCommandEnvelope({
        kind: 'start-work-session',
        goalSeconds: 3 * 60 * 60,
        energy: 'steady',
      })
    );
    expect(started.ok).toBe(true);
    const focus = await readFocusDocument(adapter);
    const originalDeadline = focus.focusDeadlineAtEpochMs;

    const selected = await root.value.workRhythm.command(
      createWorkRhythmCommandEnvelope({ kind: 'select-tasks', taskIds: [secondId] })
    );
    expect(selected.ok).toBe(true);
    const updated = await readFocusDocument(adapter);

    expect(updated.focusDeadlineAtEpochMs).toBe(originalDeadline);
    expect(updated.selectedTaskIds).toEqual([secondId]);
  });

  it('skips task cap on final focus blocks near work session end', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const root = await createBackgroundCompositionRoot({ adapter });
    if (!root.ok) {
      throw new Error('expected root');
    }

    const created = await root.value.taskList.createTask({
      title: 'Wrap up',
      originalEstimateMinutes: 30,
    });
    if (!created.ok) {
      throw new Error('expected task');
    }
    const taskId = created.snapshot.snapshot.incompleteTasks[0]?.id;
    if (!taskId) {
      throw new Error('expected task id');
    }
    const started = await root.value.workRhythm.command(
      createWorkRhythmCommandEnvelope({
        kind: 'start-work-session',
        goalSeconds: 15 * 60,
        energy: 'steady',
      })
    );
    expect(started.ok).toBe(true);
    const focus = await readFocusDocument(adapter);

    expect(focus.isFinalFocus).toBe(true);
    expect(focus.focusDurationSeconds).toBe(15 * 60);
    expect(focus.schedulerReasons.map((reason) => reason.code)).not.toContain('task-cap');
  });
});
