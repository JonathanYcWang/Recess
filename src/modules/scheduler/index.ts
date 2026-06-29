type SchedulerPhase = 'idle' | 'focus' | 'reward-game' | 'return-countdown' | 'recess';

type RunningSchedulerState = {
  status: 'running';
  phase: SchedulerPhase;
  phaseEndsAt: string;
};

type PausedSchedulerState = {
  status: 'paused';
  phase: Exclude<SchedulerPhase, 'idle'>;
  remainingMs: number;
};

export type SchedulerState =
  | { status: 'idle'; phase: 'idle' }
  | RunningSchedulerState
  | PausedSchedulerState;

export const FOCUS_DURATION_MS = 25.5 * 60 * 1000;
export const REWARD_GAME_DURATION_MS = 60 * 1000;
export const RECESS_DURATION_MS = 5 * 60 * 1000;

export const createDefaultSchedulerState = (): SchedulerState => ({
  status: 'idle',
  phase: 'idle',
});

const endsAt = (now: Date, durationMs: number): string =>
  new Date(now.getTime() + durationMs).toISOString();

export const startFocus = (now: Date): SchedulerState => ({
  status: 'running',
  phase: 'focus',
  phaseEndsAt: endsAt(now, FOCUS_DURATION_MS),
});

export const advanceScheduler = (state: SchedulerState, now: Date): SchedulerState => {
  if (state.status !== 'running' || now < new Date(state.phaseEndsAt)) {
    return state;
  }

  if (state.phase === 'focus') {
    return {
      status: 'running',
      phase: 'reward-game',
      phaseEndsAt: endsAt(now, REWARD_GAME_DURATION_MS),
    };
  }

  if (state.phase === 'reward-game') {
    return {
      status: 'running',
      phase: 'recess',
      phaseEndsAt: endsAt(now, RECESS_DURATION_MS),
    };
  }

  return startFocus(now);
};

export const pauseScheduler = (state: SchedulerState, now: Date): SchedulerState => {
  if (state.status !== 'running' || state.phase === 'idle') {
    return state;
  }

  return {
    status: 'paused',
    phase: state.phase,
    remainingMs: Math.max(0, new Date(state.phaseEndsAt).getTime() - now.getTime()),
  };
};

export const resumeScheduler = (state: SchedulerState, now: Date): SchedulerState => {
  if (state.status !== 'paused') {
    return state;
  }

  return {
    status: 'running',
    phase: state.phase,
    phaseEndsAt: endsAt(now, state.remainingMs),
  };
};
