import { describe, expect, it, vi } from 'vitest';
import {
  WorkRhythmConnectionManager,
  resetWorkRhythmConnectionManagerForTests,
} from '@/store/workRhythmConnectionManager';
import type { WorkRhythmClient } from '@/runtime/workRhythmTypes';
import {
  setWorkRhythmConnectionState,
  setWorkRhythmProjection,
} from '@/store/actions/workRhythmProjectionActions';

describe('WorkRhythmConnectionManager', () => {
  it('projects snapshots from one subscription without mounted polling intervals', async () => {
    resetWorkRhythmConnectionManagerForTests();
    const dispatch = vi.fn();
    const snapshot = {
      revision: 2,
      snapshot: {
        phase: 'focus-block' as const,
        sessionId: 'ws-1',
        originalGoalSeconds: 3600,
        remainingWorkSessionSeconds: 3600,
        remainingFocusSeconds: 1200,
        energy: 'steady' as const,
        momentum: 'steady' as const,
        isFinalFocus: false,
        focusBlockStreak: 0,
        blocksUntilNextStreakMilestone: 3,
        schedulerReasonCodes: ['base-cadence' as const],
        windDownActive: false,
        selectedTaskIds: [],
        activeTaskId: null,
      },
    };

    const client: WorkRhythmClient = {
      current: async () => ({ ok: true, value: snapshot }),
      command: async () => ({ ok: true, revision: snapshot.revision, snapshot }),
      selectTasks: async () => ({ ok: true, revision: snapshot.revision, snapshot }),
      setActiveTask: async () => ({ ok: true, revision: snapshot.revision, snapshot }),
      subscribe(listener) {
        listener(snapshot);
        return () => undefined;
      },
    };

    const manager = new WorkRhythmConnectionManager({ client, dispatch, backoffMs: [1] });
    manager.start();
    await Promise.resolve();

    expect(dispatch).toHaveBeenCalledWith(setWorkRhythmProjection(snapshot));
    expect(dispatch).toHaveBeenCalledWith(setWorkRhythmConnectionState('connected'));
    manager.stop();
    resetWorkRhythmConnectionManagerForTests();
  });
});
