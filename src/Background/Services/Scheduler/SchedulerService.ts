import {
  PHASE_DURATION,
  SCHEDULER_PHASE,
  WORK_SESSION_DURATION,
  type TimedSchedulerPhase,
} from '@/Shared/Constants/Constants';
import type { SchedulerState } from '@/Shared/Types/AppState';

const iso = (date: Date): string => date.toISOString();

const elapsedSince = (startTime: string, now: Date): number =>
  Math.max(0, Math.floor((now.getTime() - new Date(startTime).getTime()) / 1000));

export const computePhaseEndTime = (scheduler: SchedulerState): Date | null => {
  if (scheduler.activePhase === SCHEDULER_PHASE.PAUSE || scheduler.phaseStart === null) {
    return null;
  }

  const phaseStartMs = new Date(scheduler.phaseStart).getTime();
  return new Date(phaseStartMs + scheduler.phaseRemaining * 1000);
};

export const computeFocusBlockDuration = (state: SchedulerState): number => {
  const remainingAfterRecess = Math.max(0, state.workSessionRemaining - PHASE_DURATION.RECESS);
  return Math.min(PHASE_DURATION.FOCUS_BLOCK, remainingAfterRecess);
};

export const createDefaultSchedulerState = (): SchedulerState => ({
  activePhase: null,
  phaseStart: null,
  phaseTarget: 0,
  phaseRemaining: 0,
  workSessionTarget: WORK_SESSION_DURATION,
  workSessionRemaining: WORK_SESSION_DURATION,
  // timeline: [],
});

const startPhase = (
  state: SchedulerState,
  phase: TimedSchedulerPhase,
  now: Date
): SchedulerState => {
  const duration =
    phase === SCHEDULER_PHASE.FOCUS_BLOCK
      ? computeFocusBlockDuration(state)
      : PHASE_DURATION[phase];

  return {
    ...state,
    activePhase: phase,
    phaseStart: iso(now),
    phaseTarget: duration,
    phaseRemaining: duration,
  };
};

export const startWorkSession = (now: Date): SchedulerState => {
  const startedWorkSession = createDefaultSchedulerState();
  return startFocusBlock(startedWorkSession, now);
};

export const startFocusBlock = (state: SchedulerState, now: Date): SchedulerState => {
  return startPhase(state, SCHEDULER_PHASE.FOCUS_BLOCK, now);
};

export const startRewardGame = (state: SchedulerState, now: Date): SchedulerState => {
  if (state.activePhase !== SCHEDULER_PHASE.FOCUS_BLOCK) {
    return state;
  }
  return startPhase(state, SCHEDULER_PHASE.REWARD_GAME, now);
};

export const startRecess = (state: SchedulerState, now: Date): SchedulerState => {
  if (state.activePhase !== SCHEDULER_PHASE.REWARD_GAME) {
    return state;
  }

  if (state.workSessionRemaining <= PHASE_DURATION.RECESS) {
    return endWorkSession(state);
  }

  return startPhase(state, SCHEDULER_PHASE.RECESS, now);
};

export const endWorkSession = (state: SchedulerState): SchedulerState => ({
  ...state,
  activePhase: null,
  phaseStart: null,
  phaseTarget: 0,
  phaseRemaining: 0,
});

export const pauseScheduler = (state: SchedulerState, now: Date): SchedulerState => {
  if (state.activePhase !== SCHEDULER_PHASE.FOCUS_BLOCK || state.phaseStart === null) {
    return state;
  }

  const elapsed = elapsedSince(state.phaseStart, now);

  return {
    ...state,
    activePhase: SCHEDULER_PHASE.PAUSE,
    phaseStart: iso(now),
    phaseRemaining: Math.max(0, state.phaseRemaining - elapsed),
    workSessionRemaining: Math.max(0, state.workSessionRemaining - elapsed),
  };
};

export const resumeScheduler = (state: SchedulerState, now: Date): SchedulerState => {
  if (state.activePhase !== SCHEDULER_PHASE.PAUSE) {
    return state;
  }

  return {
    ...state,
    activePhase: SCHEDULER_PHASE.FOCUS_BLOCK,
    phaseStart: iso(now),
  };
};

export const evaluateScheduler = (state: SchedulerState, now: Date): SchedulerState => {
  if (
    state.activePhase === null ||
    state.activePhase === SCHEDULER_PHASE.PAUSE ||
    state.phaseStart === null
  ) {
    return state;
  }

  const elapsed = elapsedSince(state.phaseStart, now);

  if (elapsed < state.phaseRemaining) {
    return state;
  }

  const nextRemaining =
    state.activePhase === SCHEDULER_PHASE.REWARD_GAME
      ? state.workSessionRemaining
      : state.workSessionRemaining - elapsed;

  const decrementedState: SchedulerState = { ...state, workSessionRemaining: nextRemaining };

  if (nextRemaining <= 0) {
    return endWorkSession(decrementedState);
  }

  if (state.activePhase === SCHEDULER_PHASE.FOCUS_BLOCK) {
    return startRewardGame(decrementedState, now);
  }

  if (state.activePhase === SCHEDULER_PHASE.REWARD_GAME) {
    return startRecess(decrementedState, now);
  }

  if (state.activePhase === SCHEDULER_PHASE.RECESS) {
    return startFocusBlock(decrementedState, now);
  }

  return state;
};
