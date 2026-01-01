import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TimerState, Reward } from '../../lib/types';
import {
  DEFAULT_BACK_TO_IT_TIME,
  DEFAULT_REROLLS,
  DEFAULT_TOTAL_WORK_DURATION,
} from '../../lib/constants';
import { calculateRemaining } from '../../lib/timer-utils';
import {
  getInitialCEWMA,
  updateCEWMA,
  calculateProgress,
  calculateFatigue,
  calculateFocusSessionDuration,
  calculateBreakDuration,
  secondsToMinutes,
  minutesToSeconds,
} from '../../lib/session-duration-calculator';

// Create initial state with temporary placeholder values that will be replaced by dynamic calculations
const initialState: TimerState = {
  sessionState: 'BEFORE_SESSION',
  isPaused: false,
  initialWorkSessionDuration: DEFAULT_TOTAL_WORK_DURATION,
  workSessionDurationRemaining: DEFAULT_TOTAL_WORK_DURATION,
  initialFocusSessionDuration: 0, // Will be set below
  initialBreakSessionDuration: 0, // Will be set below
  focusSessionDurationRemaining: 0, // Will be set below
  breakSessionDurationRemaining: 0, // Will be set below

  backToItTimeRemaining: DEFAULT_BACK_TO_IT_TIME,
  initialBackToItDuration: DEFAULT_BACK_TO_IT_TIME,
  rerolls: DEFAULT_REROLLS,
  selectedReward: null,

  // Will be calculated below based on initial momentum/fatigue/progress
  nextFocusDuration: 0, // Will be set below
  nextBreakDuration: 0, // Will be set below
  lastFocusSessionCompleted: false,
  generatedRewards: [],

  // Dynamic session duration tracking
  momentum: getInitialCEWMA(), // Start at neutral 0.5
  completedWorkMinutesToday: 0,
  targetWorkMinutesToday: secondsToMinutes(DEFAULT_TOTAL_WORK_DURATION), // Convert from seconds
  lastCompletedSessionMinutes: 0,
};

// Calculate initial session durations based on starting state (momentum=0.5, fatigue=0, progress=0)
const initialDurations = calculateNextSessionDurations(initialState);
initialState.nextFocusDuration = initialDurations.nextFocusDuration;
initialState.nextBreakDuration = initialDurations.nextBreakDuration;
initialState.initialFocusSessionDuration = initialDurations.nextFocusDuration;
initialState.initialBreakSessionDuration = initialDurations.nextBreakDuration;
initialState.focusSessionDurationRemaining = initialDurations.nextFocusDuration;
initialState.breakSessionDurationRemaining = initialDurations.nextBreakDuration;

/**
 * Helper to calculate next focus and break durations based on current state
 * Uses momentum, fatigue, and progress to determine optimal session lengths
 * Clamps focus duration to remaining work time if needed
 */
function calculateNextSessionDurations(state: TimerState): {
  nextFocusDuration: number;
  nextBreakDuration: number;
} {
  const progress = calculateProgress(state.completedWorkMinutesToday, state.targetWorkMinutesToday);

  const fatigue = calculateFatigue(
    state.completedWorkMinutesToday,
    state.targetWorkMinutesToday,
    state.lastCompletedSessionMinutes
  );

  const focusDurationMinutes = calculateFocusSessionDuration(state.momentum, fatigue, progress);

  const breakDurationMinutes = calculateBreakDuration(fatigue, progress, state.momentum);

  // Clamp focus duration to remaining work time if the calculated duration exceeds it
  let focusDurationSeconds = minutesToSeconds(focusDurationMinutes);
  if (focusDurationSeconds > state.workSessionDurationRemaining) {
    focusDurationSeconds = state.workSessionDurationRemaining;
  }

  return {
    nextFocusDuration: focusDurationSeconds,
    nextBreakDuration: minutesToSeconds(breakDurationMinutes),
  };
}

const timerSlice = createSlice({
  name: 'timer',
  initialState,
  reducers: {
    updateTimerState: (state, action: PayloadAction<Partial<TimerState>>) => {
      return { ...state, ...action.payload };
    },

    resetTimer: () => initialState,

    startFocusSession: (state) => {
      state.sessionState = 'DURING_SESSION';
      state.focusSessionDurationRemaining = state.nextFocusDuration;
      state.focusSessionEntryTimeStamp = Date.now();
      state.initialFocusSessionDuration = state.nextFocusDuration;
      state.isPaused = false;
    },

    pauseSession: (state) => {
      if (state.isPaused) return;

      state.isPaused = true;

      // Save current remaining time when pausing
      if (state.sessionState === 'DURING_SESSION') {
        const currentRemaining = calculateRemaining(
          state.initialFocusSessionDuration,
          state.focusSessionEntryTimeStamp
        );
        state.focusSessionDurationRemaining = currentRemaining;
        state.focusSessionEntryTimeStamp = undefined;
      }
    },

    resumeSession: (state) => {
      if (!state.isPaused) return; // Not paused

      state.isPaused = false;

      // Restore timestamps when resuming
      if (state.sessionState === 'DURING_SESSION') {
        state.focusSessionEntryTimeStamp = Date.now();
        state.initialFocusSessionDuration = state.focusSessionDurationRemaining;
      }
    },

    endSessionEarly: (state) => {
      const getNextFocusState = (
        currentWorkRemaining: number,
        initialFocusDuration: number,
        actualFocusRemaining: number,
        lastCompleted: boolean
      ): Partial<TimerState> => {
        const completedInSegment = Math.max(0, initialFocusDuration - actualFocusRemaining);
        const newWorkRemaining = Math.max(0, currentWorkRemaining - completedInSegment);

        // Update momentum - session was abandoned (not completed)
        const newMomentum = updateCEWMA(state.momentum, false);

        // Track partial completed work (convert seconds to minutes)
        const completedMinutes = secondsToMinutes(completedInSegment);
        const newCompletedWork = state.completedWorkMinutesToday + completedMinutes;
        const newLastSessionMinutes = completedMinutes;

        // Calculate next session durations with updated momentum
        const tempState = {
          ...state,
          momentum: newMomentum,
          completedWorkMinutesToday: newCompletedWork,
          lastCompletedSessionMinutes: newLastSessionMinutes,
        };
        const durations = calculateNextSessionDurations(tempState);

        if (newWorkRemaining <= 0) {
          return {
            sessionState: 'SESSION_COMPLETE',
            focusSessionDurationRemaining: durations.nextFocusDuration,
            workSessionDurationRemaining: 0,
            focusSessionEntryTimeStamp: undefined,
            initialFocusSessionDuration: durations.nextFocusDuration,
            lastFocusSessionCompleted: lastCompleted,
            momentum: newMomentum,
            completedWorkMinutesToday: newCompletedWork,
            lastCompletedSessionMinutes: newLastSessionMinutes,
            nextFocusDuration: durations.nextFocusDuration,
            nextBreakDuration: durations.nextBreakDuration,
          };
        }

        return {
          sessionState: 'REWARD_SELECTION',
          focusSessionDurationRemaining: durations.nextFocusDuration,
          workSessionDurationRemaining: newWorkRemaining,
          focusSessionEntryTimeStamp: undefined,
          initialFocusSessionDuration: durations.nextFocusDuration,
          lastFocusSessionCompleted: lastCompleted,
          momentum: newMomentum,
          completedWorkMinutesToday: newCompletedWork,
          lastCompletedSessionMinutes: newLastSessionMinutes,
          nextFocusDuration: durations.nextFocusDuration,
          nextBreakDuration: durations.nextBreakDuration,
        };
      };

      // Break case
      if (state.sessionState === 'BREAK') {
        state.sessionState = 'BACK_TO_IT';
        state.breakSessionEntryTimeStamp = undefined;
        state.backToItTimeRemaining = DEFAULT_BACK_TO_IT_TIME;
        state.initialBackToItDuration = DEFAULT_BACK_TO_IT_TIME;
        state.backToItEntryTimeStamp = Date.now();
        state.isPaused = false;
        return;
      }

      // Session case (DURING_SESSION or PAUSED)
      let actualRemaining = state.focusSessionDurationRemaining;
      if (state.sessionState === 'DURING_SESSION') {
        actualRemaining = calculateRemaining(
          state.initialFocusSessionDuration,
          state.focusSessionEntryTimeStamp
        );
      }

      const nextState = getNextFocusState(
        state.workSessionDurationRemaining,
        state.initialFocusSessionDuration,
        actualRemaining,
        false
      );

      Object.assign(state, nextState);
    },

    selectReward: (state, action: PayloadAction<Reward>) => {
      const reward = action.payload;
      state.selectedReward = reward;
      state.breakSessionDurationRemaining = reward.durationSeconds;
      state.sessionState = 'BREAK';
      state.breakSessionEntryTimeStamp = Date.now();
      state.initialBreakSessionDuration = reward.durationSeconds;
      state.nextBreakDuration = reward.durationSeconds;
    },

    setGeneratedRewards: (state, action: PayloadAction<Reward[]>) => {
      state.generatedRewards = action.payload;
    },

    rerollReward: (state, action: PayloadAction<{ index: number; newReward: Reward }>) => {
      if (state.rerolls > 0) {
        state.generatedRewards[action.payload.index] = action.payload.newReward;
        state.rerolls -= 1;
      }
    },

    transitionToFocusSession: (state) => {
      state.sessionState = 'DURING_SESSION';
      state.focusSessionDurationRemaining = state.nextFocusDuration;
      state.backToItTimeRemaining = DEFAULT_BACK_TO_IT_TIME;
      state.initialBackToItDuration = DEFAULT_BACK_TO_IT_TIME;
      state.backToItEntryTimeStamp = undefined;
      state.focusSessionEntryTimeStamp = Date.now();
      state.initialFocusSessionDuration = state.nextFocusDuration;
    },

    transitionToRewardSelection: (state) => {
      const completedInSegment = state.initialFocusSessionDuration;
      const newWorkRemaining = Math.max(0, state.workSessionDurationRemaining - completedInSegment);

      // Update momentum - session was completed
      state.momentum = updateCEWMA(state.momentum, true);

      // Track completed work (convert seconds to minutes)
      const completedMinutes = secondsToMinutes(completedInSegment);
      state.completedWorkMinutesToday += completedMinutes;
      state.lastCompletedSessionMinutes = completedMinutes;

      // Calculate next session durations based on updated state
      const durations = calculateNextSessionDurations(state);
      state.nextFocusDuration = durations.nextFocusDuration;
      state.nextBreakDuration = durations.nextBreakDuration;

      if (newWorkRemaining <= 0) {
        state.sessionState = 'SESSION_COMPLETE';
        state.workSessionDurationRemaining = 0;
      } else {
        state.sessionState = 'REWARD_SELECTION';
        state.workSessionDurationRemaining = newWorkRemaining;
      }

      state.focusSessionDurationRemaining = state.nextFocusDuration;
      state.focusSessionEntryTimeStamp = undefined;
      state.initialFocusSessionDuration = state.nextFocusDuration;
      state.lastFocusSessionCompleted = true;
      state.isPaused = false;
    },

    transitionToBackToIt: (state) => {
      state.sessionState = 'BACK_TO_IT';
      state.breakSessionDurationRemaining = state.nextBreakDuration;
      state.backToItTimeRemaining = DEFAULT_BACK_TO_IT_TIME;
      state.initialBackToItDuration = DEFAULT_BACK_TO_IT_TIME;
      state.backToItEntryTimeStamp = Date.now();
      state.breakSessionEntryTimeStamp = undefined;
      state.initialBreakSessionDuration = state.nextBreakDuration;
      state.isPaused = false;
    },
  },
});

export const {
  updateTimerState,
  resetTimer,
  startFocusSession,
  pauseSession,
  resumeSession,
  endSessionEarly,
  selectReward,
  setGeneratedRewards,
  rerollReward,
  transitionToFocusSession,
  transitionToRewardSelection,
  transitionToBackToIt,
} = timerSlice.actions;

export default timerSlice.reducer;
