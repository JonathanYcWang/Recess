import type { AccessPhase } from '@/modules/block-list';

export interface LegacyTimerSnapshot {
  sessionState?: string;
  selectedReward?: { name: string } | null;
  hallPass?: { hostname: string } | null;
}

const FOCUS_PHASES = new Set([
  'ONGOING_FOCUS_SESSION',
  'FOCUS_SESSION_COUNTDOWN',
  'REWARD_SELECTION',
]);

export const mapLegacyTimerToAccessPhase = (
  timer: LegacyTimerSnapshot | undefined
): AccessPhase => {
  const sessionState = timer?.sessionState;
  if (!sessionState || sessionState === 'IDLE') {
    return 'before-work';
  }
  if (sessionState === 'ONGOING_BREAK_SESSION') {
    return 'recess';
  }
  if (sessionState === 'ONGOING_TIMEOUT_SESSION') {
    return 'time-out';
  }
  if (sessionState === 'BREAK_SESSION_COUNTDOWN') {
    return 'back-to-work-countdown';
  }
  if (sessionState === 'REWARD_GAME') {
    return 'reward-game';
  }
  if (sessionState === 'WORK_SESSION_ENDED') {
    return 'work-session-ended';
  }
  if (FOCUS_PHASES.has(sessionState)) {
    return 'focus-block';
  }
  return 'before-work';
};

export const mapLegacyTimerToAccessContext = (
  timer: LegacyTimerSnapshot | undefined,
  blockListEntries: readonly string[]
) => ({
  phase: mapLegacyTimerToAccessPhase(timer),
  blockListEntries,
  recessPassEntry: timer?.selectedReward?.name ?? null,
  hallPassEntry: timer?.hallPass?.hostname ?? null,
});
