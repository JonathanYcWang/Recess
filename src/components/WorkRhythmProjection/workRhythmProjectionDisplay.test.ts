import { describe, expect, it } from 'vitest';
import { describeWorkRhythmProjection } from '@/components/WorkRhythmProjection/workRhythmProjectionDisplay';
import type { WorkRhythmSnapshot } from '@/modules/work-rhythm';

const lifecycleSnapshots: Array<{
  name: string;
  snapshot: WorkRhythmSnapshot;
  expected: string;
}> = [
  {
    name: 'inactive',
    snapshot: { phase: 'inactive' },
    expected: 'Work rhythm inactive',
  },
  {
    name: 'focus block',
    snapshot: {
      phase: 'focus-block',
      sessionId: 'ws-1',
      originalGoalSeconds: 3600,
      remainingWorkSessionSeconds: 3600,
      remainingFocusSeconds: 1500,
      energy: 'steady',
      momentum: 'steady',
      isFinalFocus: false,
      focusBlockStreak: 0,
      blocksUntilNextStreakMilestone: 3,
      schedulerReasonCodes: ['base-cadence'],
      windDownActive: false,
    },
    expected: 'Focus block, 1500s remaining',
  },
  {
    name: 'focus block wind-down',
    snapshot: {
      phase: 'focus-block',
      sessionId: 'ws-1',
      originalGoalSeconds: 3600,
      remainingWorkSessionSeconds: 3600,
      remainingFocusSeconds: 90,
      energy: 'steady',
      momentum: 'steady',
      isFinalFocus: false,
      focusBlockStreak: 1,
      blocksUntilNextStreakMilestone: 2,
      schedulerReasonCodes: ['base-cadence'],
      windDownActive: true,
    },
    expected: 'Focus block, 90s remaining, wind-down active',
  },
  {
    name: 'recess prompt',
    snapshot: {
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
    expected: 'Recess prompt, 2100s work session remaining',
  },
  {
    name: 'time out',
    snapshot: {
      phase: 'time-out',
      sessionId: 'ws-1',
      originalGoalSeconds: 3600,
      remainingWorkSessionSeconds: 3000,
      remainingFocusSeconds: 900,
      elapsedTimeOutSeconds: 120,
      energy: 'steady',
      momentum: 'steady',
      focusBlockStreak: 1,
      blocksUntilNextStreakMilestone: 2,
      isFinalFocus: false,
    },
    expected: 'Time out, 900s focus remaining',
  },
  {
    name: 'work session completed',
    snapshot: {
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
    expected: 'Work session completed, 28800s extension allowance',
  },
];

describe('describeWorkRhythmProjection', () => {
  it.each(lifecycleSnapshots)(
    'describes $name snapshots from projection state',
    ({ snapshot, expected }) => {
      expect(describeWorkRhythmProjection(snapshot, 'connected')).toBe(expected);
    }
  );

  it('describes disconnected transport state without snapshot polling', () => {
    expect(describeWorkRhythmProjection({ phase: 'inactive' }, 'disconnected')).toBe(
      'Work rhythm disconnected'
    );
  });
});
