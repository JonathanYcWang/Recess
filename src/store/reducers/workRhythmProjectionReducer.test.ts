import { describe, expect, it } from 'vitest';
import {
  setWorkRhythmConnectionState,
  setWorkRhythmProjection,
} from '../actions/workRhythmProjectionActions';
import workRhythmProjectionReducer from './workRhythmProjectionReducer';
import type { WorkRhythmSnapshot } from '@/modules/work-rhythm';

const snapshots: WorkRhythmSnapshot[] = [
  { phase: 'inactive' },
  {
    phase: 'focus-block',
    sessionId: 'ws-1',
    originalGoalSeconds: 3600,
    remainingWorkSessionSeconds: 3600,
    remainingFocusSeconds: 1200,
    energy: 'steady',
    momentum: 'steady',
    isFinalFocus: false,
    focusBlockStreak: 0,
    blocksUntilNextStreakMilestone: 3,
    schedulerReasonCodes: ['base-cadence'],
    windDownActive: false,
  },
  {
    phase: 'recess-prompt',
    sessionId: 'ws-1',
    originalGoalSeconds: 3600,
    remainingWorkSessionSeconds: 2100,
    energy: 'steady',
    momentum: 'steady',
    focusBlockStreak: 1,
    blocksUntilNextStreakMilestone: 2,
    deferredRecessCount: 1,
    originalGoalPermanentlyComplete: false,
  },
  {
    phase: 'time-out',
    sessionId: 'ws-1',
    originalGoalSeconds: 3600,
    remainingWorkSessionSeconds: 3000,
    remainingFocusSeconds: 900,
    elapsedTimeOutSeconds: 60,
    energy: 'steady',
    momentum: 'steady',
    focusBlockStreak: 1,
    blocksUntilNextStreakMilestone: 2,
    isFinalFocus: false,
  },
  {
    phase: 'work-session-completed',
    sessionId: 'ws-1',
    originalGoalSeconds: 3600,
    cumulativeExtensionSeconds: 0,
    extensionCount: 0,
    remainingExtensionAllowanceSeconds: 28_800,
    energy: 'steady',
    momentum: 'steady',
    focusBlockStreak: 2,
    blocksUntilNextStreakMilestone: 1,
  },
];

describe('workRhythmProjectionReducer', () => {
  it.each(snapshots.map((snapshot, index) => ({ snapshot, index })))(
    'stores discriminated snapshot phase $snapshot.phase',
    ({ snapshot, index }) => {
      const state = workRhythmProjectionReducer(
        undefined,
        setWorkRhythmProjection({ revision: index + 1, snapshot })
      );
      expect(state.snapshot.phase).toBe(snapshot.phase);
      expect(state.revision).toBe(index + 1);
      expect(state.connectionState).toBe('connected');
    }
  );

  it('preserves disconnected connection state without clearing the snapshot', () => {
    const connected = workRhythmProjectionReducer(
      undefined,
      setWorkRhythmProjection({ revision: 1, snapshot: { phase: 'inactive' } })
    );
    const disconnected = workRhythmProjectionReducer(
      connected,
      setWorkRhythmConnectionState('disconnected')
    );
    expect(disconnected.connectionState).toBe('disconnected');
    expect(disconnected.snapshot.phase).toBe('inactive');
  });
});
