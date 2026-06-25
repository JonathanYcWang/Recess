import { describe, expect, it } from 'vitest';
import {
  createTaskFocusedTimeAttributedFact,
  taskFocusedTimeAttributedFactId,
} from './taskFocusedTimeAttributed';

describe('taskFocusedTimeAttributed facts', () => {
  it('creates stable factual records', () => {
    const factId = taskFocusedTimeAttributedFactId('ws-1', 'task-1', 1_000, 2_500);
    const fact = createTaskFocusedTimeAttributedFact({
      factId,
      recordedAt: 2_500,
      workSessionId: 'ws-1',
      taskId: 'task-1',
      seconds: 1,
      attributedAt: 2_500,
      focusBlockIndex: 0,
      intervalStartedAt: 1_000,
      intervalEndedAt: 2_500,
    });
    expect(fact).toEqual({
      id: factId,
      recordedAt: 2_500,
      kind: 'task-focused-time-attributed',
      payload: {
        schemaVersion: 1,
        workSessionId: 'ws-1',
        taskId: 'task-1',
        seconds: 1,
        attributedAt: 2_500,
        focusBlockIndex: 0,
        intervalStartedAt: 1_000,
        intervalEndedAt: 2_500,
      },
    });
  });
});
