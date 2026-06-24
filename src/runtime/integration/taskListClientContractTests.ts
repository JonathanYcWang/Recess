import { describe, expect, it } from 'vitest';
import type { TaskListClient } from '../taskListTypes';

export const describeTaskListClientContractTests = (
  suiteName: string,
  createClient: () => Promise<TaskListClient>
): void => {
  describe(`task list client contract (${suiteName})`, () => {
    it('returns the current Task List snapshot', async () => {
      const client = await createClient();
      const current = await client.current();
      expect(current.ok).toBe(true);
      if (current.ok) {
        expect(current.value.revision).toBeGreaterThanOrEqual(0);
        expect(Array.isArray(current.value.snapshot.incompleteTasks)).toBe(true);
        expect(Array.isArray(current.value.snapshot.completedTasks)).toBe(true);
      }
    });

    it('commits a create-task command', async () => {
      const client = await createClient();
      const changed = await client.createTask({
        title: 'Contract test task',
        originalEstimateMinutes: 30,
      });
      expect(changed).toMatchObject({
        ok: true,
        snapshot: {
          snapshot: {
            incompleteTasks: expect.arrayContaining([
              expect.objectContaining({ title: 'Contract test task' }),
            ]),
          },
        },
      });
    });

    it('publishes subscription updates after commands', async () => {
      const client = await createClient();
      const revisions: number[] = [];
      const unsubscribe = client.subscribe((snapshot) => {
        revisions.push(snapshot.revision);
      });

      await client.createTask({ title: 'Subscribe test', originalEstimateMinutes: 15 });
      unsubscribe();

      expect(revisions.length).toBeGreaterThan(0);
    });

    it('rejects invalid titles without committing', async () => {
      const client = await createClient();
      const rejected = await client.createTask({ title: '   ', originalEstimateMinutes: 30 });
      expect(rejected).toEqual({
        ok: false,
        error: { kind: 'invalid-title' },
      });
    });

    it('reorders incomplete tasks', async () => {
      const client = await createClient();
      const first = await client.createTask({ title: 'First', originalEstimateMinutes: 15 });
      const second = await client.createTask({ title: 'Second', originalEstimateMinutes: 15 });
      if (!first.ok || !second.ok) {
        throw new Error('expected tasks');
      }
      const ids = second.snapshot.snapshot.incompleteTasks.map((task) => task.id);
      const reordered = await client.reorderTasks([ids[1], ids[0]], {
        expectedRevision: second.revision,
      });
      expect(reordered.ok).toBe(true);
      if (reordered.ok) {
        expect(reordered.snapshot.snapshot.incompleteTasks.map((task) => task.title)).toEqual([
          'Second',
          'First',
        ]);
      }
    });

    it('completes and deletes tasks', async () => {
      const client = await createClient();
      const created = await client.createTask({ title: 'Finish me', originalEstimateMinutes: 45 });
      if (!created.ok) {
        throw new Error('expected create');
      }
      const taskId = created.snapshot.snapshot.incompleteTasks[0].id;
      const completed = await client.completeTask(taskId, { expectedRevision: created.revision });
      expect(completed.ok).toBe(true);
      if (completed.ok) {
        expect(completed.snapshot.snapshot.completedTasks).toHaveLength(1);
      }
      const deleted = await client.deleteTask(taskId, {
        expectedRevision: completed.ok ? completed.revision : undefined,
      });
      expect(deleted.ok).toBe(true);
    });
  });
};
