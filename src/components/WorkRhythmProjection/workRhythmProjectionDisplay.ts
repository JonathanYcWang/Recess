import type { WorkRhythmConnectionState } from '@/store/reducers/workRhythmProjectionReducer';
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
    default: {
      const exhaustive: never = snapshot;
      return exhaustive;
    }
  }
};
