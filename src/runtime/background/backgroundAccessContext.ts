import type { AccessContext, AccessPhase } from '@/modules/block-list';
import type { WorkRhythmSnapshot } from '@/modules/work-rhythm';

const mapWorkRhythmPhase = (snapshot: WorkRhythmSnapshot): AccessPhase => {
  switch (snapshot.phase) {
    case 'inactive':
      return 'before-work';
    case 'focus-block':
      return 'focus-block';
    case 'recess-prompt':
    case 'reward-game':
      return 'reward-game';
    case 'recess':
      return 'recess';
    case 'time-out':
      return 'time-out';
    case 'back-to-work-countdown':
      return 'back-to-work-countdown';
    case 'work-session-completed':
      return 'work-session-ended';
    default: {
      const exhaustive: never = snapshot;
      return exhaustive;
    }
  }
};

export const projectBackgroundAccessContext = (input: {
  workRhythmSnapshot: WorkRhythmSnapshot;
  blockListEntries: readonly string[];
  hallPassEntry: string | null;
  recessPassEntry?: string | null;
}): AccessContext => ({
  phase: mapWorkRhythmPhase(input.workRhythmSnapshot),
  blockListEntries: input.blockListEntries,
  recessPassEntry: input.recessPassEntry ?? null,
  hallPassEntry: input.hallPassEntry,
});
