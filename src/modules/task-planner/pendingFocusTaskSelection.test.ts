import { describe, expect, it } from 'vitest';
import {
  consumePendingFocusTaskIds,
  resetPendingFocusTaskIdsForTests,
  setPendingFocusTaskIds,
} from './pendingFocusTaskSelection';

describe('pendingFocusTaskSelection', () => {
  it('stores and consumes confirmed task ids for focus start', () => {
    resetPendingFocusTaskIdsForTests();
    setPendingFocusTaskIds(['task-a', 'task-b']);
    expect(consumePendingFocusTaskIds()).toEqual(['task-a', 'task-b']);
    expect(consumePendingFocusTaskIds()).toEqual([]);
  });
});
