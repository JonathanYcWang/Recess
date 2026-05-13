import { createReducer } from '@reduxjs/toolkit';
import { TimerState } from '../../types/timer';
import { Reward } from '../../types/reward';
import {
  CEWMA_STARTING_VALUE,
  DEFAULT_REROLLS,
  DEFAULT_WORK_SESSION_DURATION,
} from '../../constants/constants';
import {
  calculateBreakDuration,
  calculateFatigue,
  calculateFocusSessionDuration,
  calculateProgress,
  updateCEWMA,
} from '../../services/sessionDurationService';
import {
  addShownRewardCombination,
  endSessionEarly,
  pauseSession,
  rerollReward,
  resetTimer,
  resumeSession,
  selectReward,
  setGeneratedRewards,
  setTotalTimer,
  startFocusSession,
  transitionToFocusSession,
  transitionToFocusSessionCountdown,
  transitionToRewardSelection,
  updateTimerState,
  updateWeightMultipliers,
} from '../actions/timerActions';

const FOCUS_COUNTDOWN_DURATION = 10; // seconds
const calculateNextSessionDurations = (
  state: TimerState
): {
  nextFocusDuration: number;
  nextBreakDuration: number;
} => {
  const progress = calculateProgress(state.totalTimer, state.totalRemaining);
  const fatigue = calculateFatigue(
    state.totalTimer,
    state.totalRemaining,
    state.lastCompletedFocusSessionSeconds
  );

  let focusDuration = calculateFocusSessionDuration(
    state.momentum,
    fatigue,
    progress,
    state.momentumWeightMultiplier,
    state.fatigueWeightMultiplier
  );
  if (focusDuration > state.totalRemaining) {
    focusDuration = state.totalRemaining;
  }

  const breakDuration = calculateBreakDuration(
    fatigue,
    progress,
    state.momentum,
    state.fatigueWeightMultiplier,
    state.momentumWeightMultiplier
  );

  return {
    nextFocusDuration: focusDuration,
    nextBreakDuration: breakDuration,
  };
};

const createInitialTimerState = (): TimerState => {
  const base: TimerState = {
    sessionState: 'BEFORE_WORK_SESSION',
    isPaused: false,

    totalTimer: DEFAULT_WORK_SESSION_DURATION,
    totalRemaining: DEFAULT_WORK_SESSION_DURATION,

    currentTimer: 0,
    currentTimerRemaining: 0,
    rerolls: DEFAULT_REROLLS,
    selectedReward: null,
    shownRewardCombinations: [],

    lastFocusSessionCompleted: false,
    generatedRewards: [],

    momentum: CEWMA_STARTING_VALUE,
    lastCompletedFocusSessionSeconds: 0,

    fatigueWeightMultiplier: 1.0,
    momentumWeightMultiplier: 1.0,
  };

  const durations = calculateNextSessionDurations(base);
  base.currentTimer = durations.nextFocusDuration;
  base.currentTimerRemaining = durations.nextFocusDuration;

  return base;
};

const setCurrentSessionDuration = (state: TimerState, duration: number) => {
  state.currentTimer = duration;
  state.currentTimerRemaining = duration;
};

const clearSessionRewards = (state: TimerState) => {
  state.generatedRewards = [];
  state.shownRewardCombinations = [];
};

const resetRewards = (state: TimerState) => {
  state.rerolls = DEFAULT_REROLLS;
  clearSessionRewards(state);
};

const enterFocusSession = (state: TimerState) => {
  const durations = calculateNextSessionDurations(state);
  state.sessionState = 'ONGOING_FOCUS_SESSION';
  setCurrentSessionDuration(state, durations.nextFocusDuration);
  state.currentStartTime = Date.now();
  state.isPaused = false;
  clearSessionRewards(state);
};

const enterFocusCountdown = (state: TimerState) => {
  state.sessionState = 'FOCUS_SESSION_COUNTDOWN';
  setCurrentSessionDuration(state, FOCUS_COUNTDOWN_DURATION);
  state.currentStartTime = Date.now();
  state.isPaused = false;
  clearSessionRewards(state);
};

const enterRewardSelectionOrComplete = (state: TimerState) => {
  if (state.totalRemaining <= 0) {
    state.sessionState = 'WORK_SESSION_COMPLETE';
    state.totalRemaining = 0;
  } else {
    state.sessionState = 'REWARD_SELECTION';
  }

  state.currentStartTime = undefined;
  state.currentTimer = 0;
  state.currentTimerRemaining = 0;
  state.lastFocusSessionCompleted = true;
  state.isPaused = false;
};

// const enterBeforeWorkSession = (state: TimerState) => {
//   if (state.totalRemaining <= 0) {
//     enterRewardSelectionOrComplete(state);
//     return;
//   } else {
//     state.sessionState = 'BEFORE_WORK_SESSION';
//     const durations = calculateNextSessionDurations(state);
//     setCurrentSessionDuration(state, durations.nextFocusDuration);
//     state.currentStartTime = undefined;
//     state.isPaused = false;
//     clearSessionRewards(state);
//   }
// };

const initialState = createInitialTimerState();

const timerReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(updateTimerState, (state, action) => {
      Object.assign(state, action.payload);
    })
    .addCase(resetTimer, () => createInitialTimerState())
    .addCase(setTotalTimer, (state, action) => {
      state.totalTimer = action.payload;
      state.totalRemaining = action.payload;

      if (state.sessionState === 'BEFORE_WORK_SESSION') {
        const durations = calculateNextSessionDurations(state);
        setCurrentSessionDuration(state, durations.nextFocusDuration);
      }
    })
    .addCase(startFocusSession, (state) => {
      enterFocusSession(state);
    })
    .addCase(pauseSession, (state, action) => {
      if (state.isPaused || state.sessionState !== 'ONGOING_FOCUS_SESSION') return;

      state.isPaused = true;
      state.currentTimerRemaining = action.payload;
      state.currentStartTime = undefined;
    })
    .addCase(resumeSession, (state) => {
      if (!state.isPaused || state.sessionState !== 'ONGOING_FOCUS_SESSION') return;

      state.isPaused = false;
      state.currentStartTime = Date.now();
    })
    .addCase(endSessionEarly, (state) => {
      if (state.sessionState === 'ONGOING_BREAK_SESSION') {
        enterFocusCountdown(state);
        return;
      }

      if (state.sessionState !== 'ONGOING_FOCUS_SESSION') {
        return;
      }

      state.lastFocusSessionCompleted = false;
      state.momentum = updateCEWMA(state.momentum, state.lastFocusSessionCompleted);

      state.lastCompletedFocusSessionSeconds = state.currentTimer - state.currentTimerRemaining;
      state.totalRemaining = Math.max(
        0,
        state.totalRemaining - state.lastCompletedFocusSessionSeconds
      );

      const durations = calculateNextSessionDurations(state);
      setCurrentSessionDuration(state, durations.nextFocusDuration);
      state.currentStartTime = undefined;

      resetRewards(state);
      enterRewardSelectionOrComplete(state);
      // enterBeforeWorkSession(state);
    })
    .addCase(selectReward, (state, action) => {
      const reward: Reward = action.payload;
      state.selectedReward = reward;
      state.sessionState = 'ONGOING_BREAK_SESSION';
      setCurrentSessionDuration(state, reward.durationSeconds);
      state.currentStartTime = Date.now();
      clearSessionRewards(state);
    })
    .addCase(setGeneratedRewards, (state, action) => {
      state.generatedRewards = action.payload;
    })
    .addCase(addShownRewardCombination, (state, action) => {
      if (!state.shownRewardCombinations.includes(action.payload)) {
        state.shownRewardCombinations.push(action.payload);
      }
    })
    .addCase(rerollReward, (state, action) => {
      if (state.rerolls > 0) {
        state.generatedRewards[action.payload.index] = action.payload.newReward;
        state.rerolls -= 1;
      }
    })
    .addCase(transitionToFocusSession, (state) => {
      enterFocusSession(state);
    })
    .addCase(transitionToRewardSelection, (state) => {
      state.momentum = updateCEWMA(state.momentum, true);

      state.lastCompletedFocusSessionSeconds = state.currentTimer;
      state.totalRemaining = Math.max(
        0,
        state.totalRemaining - state.lastCompletedFocusSessionSeconds
      );

      const durations = calculateNextSessionDurations(state);
      setCurrentSessionDuration(state, durations.nextFocusDuration);

      resetRewards(state);
      enterRewardSelectionOrComplete(state);
    })
    .addCase(transitionToFocusSessionCountdown, (state) => {
      enterFocusCountdown(state);
    })
    .addCase(updateWeightMultipliers, (state, action) => {
      if (action.payload.fatigueMultiplier !== undefined) {
        state.fatigueWeightMultiplier = action.payload.fatigueMultiplier;
      }
      if (action.payload.momentumMultiplier !== undefined) {
        state.momentumWeightMultiplier = action.payload.momentumMultiplier;
      }

      // Recalculate next durations for upcoming stages
      const durations = calculateNextSessionDurations(state);
      if (state.sessionState === 'BEFORE_WORK_SESSION') {
        state.currentTimer = durations.nextFocusDuration;
      }
    });
});

export default timerReducer;
