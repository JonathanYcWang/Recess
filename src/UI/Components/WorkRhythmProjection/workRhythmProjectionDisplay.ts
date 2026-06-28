import type { WorkRhythmConnectionState } from '@/UI/Redux/reducers/workRhythmProjectionReducer';
import type { WorkRhythmSnapshot } from '@/modules/work-rhythm';

export const describeWorkRhythmProjection = (
  snapshot: WorkRhythmSnapshot,
  connectionState: WorkRhythmConnectionState
): string => {
  if (connectionState !== 'connected') {
    return `Work rhythm ${connectionState}`;
  }

  switch (snapshot.phase) {
    case 'inactive':
      return 'Work rhythm inactive';
    case 'focus-block':
      return `Focus block, ${snapshot.remainingFocusSeconds}s remaining${
        snapshot.windDownActive ? ', wind-down active' : ''
      }`;
    case 'recess-prompt':
      return `Recess prompt, ${snapshot.remainingWorkSessionSeconds}s work session remaining`;
    case 'time-out':
      return `Time out, ${snapshot.remainingFocusSeconds}s focus remaining`;
    case 'work-session-completed':
      return `Work session completed, ${snapshot.remainingExtensionAllowanceSeconds}s extension allowance`;
    case 'reward-game':
      return `Reward game, round ${snapshot.roundId}`;
    case 'recess':
      return `Recess, ${snapshot.remainingRecessSeconds}s remaining${
        snapshot.recessPassDestination ? `, pass: ${snapshot.recessPassDestination}` : ''
      }`;
    case 'back-to-work-countdown':
      return `Back to work in ${snapshot.remainingCountdownSeconds}s`;
    default: {
      const exhaustive: never = snapshot;
      return exhaustive;
    }
  }
};
