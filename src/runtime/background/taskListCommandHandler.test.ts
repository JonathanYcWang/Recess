import { describe, expect, it } from 'vitest';
import { createInMemoryKeyValueAdapter } from '@/adapters/browser/in-memory/inMemoryKeyValueAdapter';
import { createBackgroundCompositionRoot } from '../background/backgroundCompositionRoot';
import { RUNTIME_PROTOCOL_VERSION } from '../protocol/types';

describe('taskListCommandHandler', () => {
  it('creates, reorders, completes, and deletes tasks through one handler path', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const root = await createBackgroundCompositionRoot({ adapter });
    if (!root.ok) {
      throw new Error('expected root');
    }

    const first = await root.value.taskList.createTask({
      title: 'First task',
      originalEstimateMinutes: 30,
    });
    const second = await root.value.taskList.createTask({
      title: 'Second task',
      originalEstimateMinutes: 60,
    });
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!second.ok) {
      throw new Error('expected second task');
    }

    const ids = second.snapshot.snapshot.incompleteTasks.map((task) => task.id);
    const reordered = await root.value.taskList.reorderTasks([ids[1], ids[0]], {
      expectedRevision: second.revision,
    });
    expect(reordered.ok).toBe(true);

    const completed = await root.value.taskList.completeTask(ids[0], {
      expectedRevision: reordered.ok ? reordered.revision : undefined,
    });
    expect(completed.ok).toBe(true);

    const deleted = await root.value.taskList.deleteTask(ids[1], {
      expectedRevision: completed.ok ? completed.revision : undefined,
    });
    expect(deleted.ok).toBe(true);
  });

  it('rejects stale revisions and unsupported status mutations', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const root = await createBackgroundCompositionRoot({ adapter });
    if (!root.ok) {
      throw new Error('expected root');
    }

    const created = await root.value.taskList.createTask({
      title: 'Immutable estimate',
      originalEstimateMinutes: 45,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) {
      throw new Error('expected create');
    }

    const stale = await root.value.taskList.command({
      protocolVersion: RUNTIME_PROTOCOL_VERSION,
      commandId: 'stale-cmd',
      module: 'task-list',
      expectedRevision: 0,
      command: { kind: 'create-task', title: 'Stale', originalEstimateMinutes: 15 },
    });
    expect(stale).toMatchObject({
      ok: false,
      error: { kind: 'stale-revision' },
    });

    const unsupported = await root.value.taskList.command({
      protocolVersion: RUNTIME_PROTOCOL_VERSION,
      commandId: 'unsupported-cmd',
      module: 'task-list',
      command: {
        kind: 'set-status',
        taskId: created.snapshot.snapshot.incompleteTasks[0].id,
        status: 'in-progress',
      } as never,
    });
    expect(unsupported).toMatchObject({
      ok: false,
      error: { kind: 'unsupported-command' },
    });
  });
});
