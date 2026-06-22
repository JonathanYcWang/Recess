import { createReducer } from '@reduxjs/toolkit';
import { TimerState } from '../../types/timer';
import { Reward } from '../../types/reward';
import { DEFAULT_REROLLS, FOCUS_COUNTDOWN_DURATION } from '../../constants/constants';
import {
  calculateMomentum,
  calculateFatigue,
  calculateFocusSessionDuration,
} from '../../services/sessionDurationService';
import {
  endSessionEarly,
  endWorkSessionEarly,
  pauseSession,
  rerollReward,
  resumeSession,
  selectReward,
  setGeneratedRewards,
  setShownRewardCombinations,
  setTotalTimer,
  startFocusSession,
  transitionToBeforeWorkSession,
  transitionToFocusSession,
  transitionToFocusSessionCountdown,
  transitionToRewardSelection,
  updateFeedbackMultiplier,
  updateTimerState,
} from '../actions/timerActions';
import { SESSION_STATES } from '../../constants/constants';
import { createInitialTimerState } from '../initialState';

const setCurrentSessionDuration = (state: TimerState, duration: number) => {
  state.currentTimer = duration;
  state.currentTimerRemaining = duration;
};

const clearSessionRewards = (state: TimerState) => {
  state.rerolls = DEFAULT_REROLLS;
  state.generatedRewards = [];
  state.shownRewardCombinations = [];
};

const enterFocusSession = (state: TimerState) => {
  const nextFocusSessionDuration = calculateFocusSessionDuration(
    state.totalTimer,
    state.totalRemaining,
    state.momentumScore,
    state.fatigueScore
  );
  state.sessionState = SESSION_STATES.ONGOING_FOCUS_SESSION;
  setCurrentSessionDuration(state, nextFocusSessionDuration);
  state.currentStartTime = Date.now();
  state.isPaused = false;
  clearSessionRewards(state);
};

const enterFocusCountdown = (state: TimerState) => {
  state.sessionState = SESSION_STATES.FOCUS_SESSION_COUNTDOWN;
  setCurrentSessionDuration(state, FOCUS_COUNTDOWN_DURATION);
  state.currentStartTime = Date.now();
  state.isPaused = false;
  clearSessionRewards(state);
};

const enterBeforeWorkSession = (state: TimerState) => {
  state.sessionState = SESSION_STATES.BEFORE_WORK_SESSION;
  const nextFocusSessionDuration = calculateFocusSessionDuration(
    state.totalTimer,
    state.totalRemaining,
    state.momentumScore,
    state.fatigueScore
  );
  setCurrentSessionDuration(state, nextFocusSessionDuration);
  state.currentStartTime = undefined;
  state.isPaused = false;
  state.selectedReward = null;
  state.lastFocusSessionCompleted = false;
  clearSessionRewards(state);
};

const enterRewardSelectionOrComplete = (state: TimerState) => {
  if (state.totalRemaining <= 0) {
    state.sessionState = SESSION_STATES.WORK_SESSION_COMPLETE;
    state.totalRemaining = 0;
  } else {
    state.sessionState = SESSION_STATES.REWARD_SELECTION;
  }

  state.currentStartTime = undefined;
  state.currentTimer = 0;
  state.currentTimerRemaining = 0;
  state.lastFocusSessionCompleted = true;
  state.isPaused = false;
};

const initialState = createInitialTimerState();

const timerReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(updateTimerState, (state, action) => {
      Object.assign(state, action.payload);
    })
    .addCase(setTotalTimer, (state, action) => {
      state.totalTimer = action.payload;
      state.totalRemaining = action.payload;

      if (state.sessionState === SESSION_STATES.BEFORE_WORK_SESSION) {
        const nextFocusSessionDuration = calculateFocusSessionDuration(
          state.totalTimer,
          state.totalRemaining,
          state.momentumScore,
          state.fatigueScore
        );
        setCurrentSessionDuration(state, nextFocusSessionDuration);
      }
    })
    .addCase(startFocusSession, (state) => {
      enterFocusSession(state);
    })
    .addCase(pauseSession, (state, action) => {
      if (state.isPaused || state.sessionState !== SESSION_STATES.ONGOING_FOCUS_SESSION) return;

      state.isPaused = true;
      state.currentTimerRemaining = action.payload;
      state.currentStartTime = undefined;
    })
    .addCase(resumeSession, (state) => {
      if (!state.isPaused || state.sessionState !== SESSION_STATES.ONGOING_FOCUS_SESSION) return;

      state.isPaused = false;
      state.currentStartTime = Date.now();
    })
    .addCase(endSessionEarly, (state) => {
      if (state.sessionState === SESSION_STATES.ONGOING_BREAK_SESSION) {
        enterFocusCountdown(state);
        return;
      }

      if (state.sessionState === SESSION_STATES.ONGOING_FOCUS_SESSION) {
        state.lastFocusSessionCompleted = false;
        state.momentumScore = calculateMomentum(
          state.momentumScore,
          state.lastFocusSessionCompleted,
          state.feedbackMultiplier
        );
        state.fatigueScore = calculateFatigue(
          state.totalTimer,
          state.totalRemaining,
          state.lastFocusSessionDuration,
          state.lastFocusSessionCompleted
        );
        state.lastFocusSessionDuration = state.currentTimer - state.currentTimerRemaining;
        state.totalRemaining = Math.max(0, state.totalRemaining - state.lastFocusSessionDuration);

        const sessionDuration = calculateFocusSessionDuration(
          state.totalTimer,
          state.totalRemaining,
          state.momentumScore,
          state.fatigueScore
        );
        setCurrentSessionDuration(state, sessionDuration);
        clearSessionRewards(state);
        enterRewardSelectionOrComplete(state);
      }
    })
    .addCase(endWorkSessionEarly, (state) => {
      state.totalRemaining = 0;
      state.currentStartTime = undefined;
      state.isPaused = false;
      state.currentTimer = 0;
      state.currentTimerRemaining = 0;
      state.selectedReward = null;
      state.lastFocusSessionCompleted = false;
      clearSessionRewards(state);
      state.sessionState = SESSION_STATES.WORK_SESSION_COMPLETE;
    })
    .addCase(selectReward, (state, action) => {
      const reward: Reward = action.payload;
      state.selectedReward = reward;
      state.sessionState = SESSION_STATES.ONGOING_BREAK_SESSION;
      setCurrentSessionDuration(state, reward.duration);
      state.currentStartTime = Date.now();
      state.isPaused = false;
      clearSessionRewards(state);
    })
    .addCase(setGeneratedRewards, (state, action) => {
      state.generatedRewards = action.payload;
    })
    .addCase(setShownRewardCombinations, (state, action) => {
      state.shownRewardCombinations = action.payload;
    })
    .addCase(rerollReward, (state, action) => {
      if (state.rerolls > 0) {
        state.generatedRewards[action.payload.index] = action.payload.reward;
        state.rerolls -= 1;
      }
    })
    .addCase(transitionToFocusSession, (state) => {
      enterFocusSession(state);
    })
    .addCase(transitionToBeforeWorkSession, (state) => {
      enterBeforeWorkSession(state);
    })
    .addCase(transitionToRewardSelection, (state) => {
      state.momentumScore = calculateMomentum(state.momentumScore, true, state.feedbackMultiplier);

      state.lastFocusSessionDuration = state.currentTimer;
      state.totalRemaining = Math.max(0, state.totalRemaining - state.currentTimer);
      state.fatigueScore = calculateFatigue(
        state.totalTimer,
        state.totalRemaining,
        state.lastFocusSessionDuration,
        state.lastFocusSessionCompleted
      );
      const nextFocusSessionDuration = calculateFocusSessionDuration(
        state.totalTimer,
        state.totalRemaining,
        state.momentumScore,
        state.fatigueScore
      );
      setCurrentSessionDuration(state, nextFocusSessionDuration);

      clearSessionRewards(state);
      enterRewardSelectionOrComplete(state);
    })
    .addCase(transitionToFocusSessionCountdown, (state) => {
      enterFocusCountdown(state);
    })
    .addCase(updateFeedbackMultiplier, (state, action) => {
      state.feedbackMultiplier = action.payload;

      // Recalculate next durations for upcoming stages
      if (state.sessionState === SESSION_STATES.BEFORE_WORK_SESSION) {
        state.currentTimer = calculateFocusSessionDuration(
          state.totalTimer,
          state.totalRemaining,
          state.momentumScore,
          state.fatigueScore
        );
      }
    });
});

export default timerReducer;
