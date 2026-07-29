import { SCHEDULER_PHASE, WORK_SESSION_DURATION } from '@/Shared/Constants/Constants';
import type { SchedulerPhase, SchedulerState } from '@/Shared/Types/AppState';

export const PHASE_DURATION: Record<SchedulerPhase, number> = {
  FOCUS_BLOCK: 25 * 60,
  REWARD_GAME: 60,
  RECESS: 5 * 60,
};

const iso = (date: Date): string => date.toISOString();

const elapsedSince = (startTime: string, now: Date): number =>
  Math.max(0, Math.floor((now.getTime() - new Date(startTime).getTime()) / 1000));

export const computeFocusBlockDuration = (state: SchedulerState): number => {
  const remainingAfterRecess = Math.max(0, state.workSessionRemaining - PHASE_DURATION.RECESS);
  return Math.min(PHASE_DURATION.FOCUS_BLOCK, remainingAfterRecess);
};

export const createDefaultSchedulerState = (): SchedulerState => ({
  activePhase: null,
  phaseStart: null,
  phaseTarget: 0,
  workSessionTarget: WORK_SESSION_DURATION,
  workSessionRemaining: WORK_SESSION_DURATION,
  // timeline: [],
});

// Transitions into a new phase: stamps the start time, sets its duration, and appends an open entry to the timeline.
const startPhase = (state: SchedulerState, phase: SchedulerPhase, now: Date): SchedulerState => ({
  ...state,
  activePhase: phase,
  phaseStart: iso(now),
  phaseTarget:
    phase === SCHEDULER_PHASE.FOCUS_BLOCK
      ? computeFocusBlockDuration(state)
      : PHASE_DURATION[phase],
});

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
});

// Closes the most recent timeline entry by recording its end time (no-op if already closed).
// const endOpenTimelineEntry = (state: SchedulerState, now: Date): SchedulerState => ({
//   ...state,
//   timeline: state.timeline.map((entry, index) =>
//     index === state.timeline.length - 1 && entry.endedAt === null
//       ? { ...entry, endedAt: iso(now) }
//       : entry
//   ),
// });

// The core tick: if the current phase's duration has elapsed, advance to the next
export const evaluateScheduler = (state: SchedulerState, now: Date): SchedulerState => {
  if (state.activePhase === null || state.phaseStart === null) {
    return state;
  }

  const elapsed = elapsedSince(state.phaseStart, now);

  // Phase still in progress: keep the current phase and wait for the next tick.
  if (elapsed < state.phaseTarget) {
    return state;
  }

  // Phase finished: close its timeline entry before transitioning.
  // const closedState = endOpenTimelineEntry(state, now);

  // Decrement the session budget by the real time this phase consumed; REWARD_GAME is free.
  const nextRemaining =
    state.activePhase === SCHEDULER_PHASE.REWARD_GAME
      ? state.workSessionRemaining
      : state.workSessionRemaining - elapsed;

  const decrementedState: SchedulerState = { ...state, workSessionRemaining: nextRemaining };

  // If the work session is exhausted, your done go back to the before work session starts state
  if (nextRemaining <= 0) {
    return endWorkSession(decrementedState);
  }

  // FOCUS_BLOCK → REWARD_GAME.
  if (state.activePhase === SCHEDULER_PHASE.FOCUS_BLOCK) {
    return startRewardGame(decrementedState, now);
  }

  // REWARD_GAME → RECESS.
  if (state.activePhase === SCHEDULER_PHASE.REWARD_GAME) {
    return startRecess(decrementedState, now);
  }

  // RECESS → next FOCUS_BLOCK
  if (state.activePhase === SCHEDULER_PHASE.RECESS) {
    return startFocusBlock(decrementedState, now);
  }

  return state;
};

// Pause/resume are intentionally no-ops: focus sessions are currently unpausable by design.
export const pauseScheduler = (state: SchedulerState): SchedulerState => state;
export const resumeScheduler = (state: SchedulerState): SchedulerState => state;
