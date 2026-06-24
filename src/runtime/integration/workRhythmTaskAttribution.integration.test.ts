import { describe, expect, it } from 'vitest';
import { createInMemoryKeyValueAdapter } from '@/adapters/browser/in-memory/inMemoryKeyValueAdapter';
import { createPersistedApplicationState } from '@/modules/persisted-application-state';
import { applyTaskListCommand, createDefaultTaskListValue } from '@/modules/task-list';
import { createFixedClock } from '@/runtime/clock';
import { createInMemoryAlarmAdapter } from '@/runtime/alarms/inMemoryAlarmAdapter';
import { createBackgroundCompositionRoot } from '@/runtime/background/backgroundCompositionRoot';
import { createWorkRhythmCommandEnvelope } from '@/runtime/client/inProcessWorkRhythmClient';
import { DEFAULT_WORK_SESSION_GOAL_SECONDS } from '@/modules/work-rhythm';

describe('work rhythm task attribution integration', () => {
  it('commits work-rhythm and task-list atomically when setting an active task', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const root = await createBackgroundCompositionRoot({ adapter });
    if (!root.ok) {
      throw new Error('expected root');
    }

    await root.value.workRhythm.command(
      createWorkRhythmCommandEnvelope({
        kind: 'start-work-session',
        goalSeconds: DEFAULT_WORK_SESSION_GOAL_SECONDS,
        energy: 'steady',
      })
    );

    const created = await root.value.taskList.createTask({
      title: 'Write spec',
      originalEstimateMinutes: 30,
    });
    if (!created.ok) {
      throw new Error('expected task');
    }
    const taskId = created.snapshot.snapshot.incompleteTasks[0]?.id;
    if (!taskId) {
      throw new Error('expected task id');
    }

    const selected = await root.value.workRhythm.command(
      createWorkRhythmCommandEnvelope({ kind: 'select-tasks', taskIds: [taskId] })
    );
    expect(selected.ok).toBe(true);

    const activated = await root.value.workRhythm.command(
      createWorkRhythmCommandEnvelope({ kind: 'set-active-task', taskId })
    );
    expect(activated.ok).toBe(true);
    if (activated.ok && activated.snapshot.snapshot.phase === 'focus-block') {
      expect(activated.snapshot.snapshot.activeTaskId).toBe(taskId);
    }

    const taskList = root.value.taskListHandler.getDocument();
    expect(taskList.value.tasks[0]?.status).toBe('in-progress');
  });

  it('does not partially apply task selection when task-list revision is stale', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const persistence = createPersistedApplicationState({ adapter });
    const initialized = await persistence.initialize();
    if (!initialized.ok) {
      throw new Error('expected init');
    }

    const clock = createFixedClock(1_000_000);
    const coinHandler = (
      await import('@/runtime/background/coinCommandHandler')
    ).createCoinCommandHandler(persistence, initialized.value.documents.coin);
    const taskListHandler = (
      await import('@/runtime/background/taskListCommandHandler')
    ).createTaskListCommandHandler(persistence, initialized.value.documents['task-list'], {
      clock,
    });
    const workRhythmHandler = (
      await import('@/runtime/background/workRhythmCommandHandler')
    ).createWorkRhythmCommandHandler(persistence, initialized.value.documents['work-rhythm'], {
      clock,
      alarms: createInMemoryAlarmAdapter(),
      coinHandler,
      taskListHandler,
    });

    await workRhythmHandler.execute(
      createWorkRhythmCommandEnvelope({
        kind: 'start-work-session',
        goalSeconds: DEFAULT_WORK_SESSION_GOAL_SECONDS,
        energy: 'steady',
      })
    );

    let taskList = createDefaultTaskListValue();
    const created = applyTaskListCommand(
      taskList,
      { kind: 'create-task', title: 'Draft', originalEstimateMinutes: 15 },
      { taskId: 'task-1', nowEpochMs: 1_000_000 }
    );
    if (!created.ok) {
      throw new Error('expected task');
    }
    taskList = created.value;
    await persistence.commit([
      {
        document: 'task-list',
        expectedRevision: 0,
        value: taskList,
      },
    ]);
    taskListHandler.adoptCommitted({
      schemaVersion: 1,
      revision: 1,
      value: taskList,
    });

    const stale = await workRhythmHandler.execute(
      createWorkRhythmCommandEnvelope(
        { kind: 'select-tasks', taskIds: ['task-1'] },
        { expectedRevision: 0 }
      )
    );
    expect(stale.ok).toBe(false);
    if (!stale.ok) {
      expect(stale.error.kind).toBe('stale-revision');
    }

    const current = workRhythmHandler.current();
    expect(current.ok).toBe(true);
    if (current.ok && current.value.snapshot.phase === 'focus-block') {
      expect(current.value.snapshot.selectedTaskIds).toEqual([]);
    }
  });
});
