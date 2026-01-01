import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TimerState, Reward } from '../../lib/types';
import {
  DEFAULT_FOCUS_SESSION_COUNTDOWN_TIME,
  DEFAULT_REROLLS,
  DEFAULT_WORK_SESSION_DURATION,
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
  sessionState: 'BEFORE_WORK_SESSION',
  isPaused: false,
  initialWorkSessionDuration: DEFAULT_WORK_SESSION_DURATION,
  workSessionDurationRemaining: DEFAULT_WORK_SESSION_DURATION,
  initialFocusSessionDuration: 0, // Will be set below
  initialBreakSessionDuration: 0, // Will be set below
  focusSessionDurationRemaining: 0, // Will be set below
  breakSessionDurationRemaining: 0, // Will be set below

  focusSessionCountdownTimeRemaining: DEFAULT_FOCUS_SESSION_COUNTDOWN_TIME,
  initialFocusSessionCountdownDuration: DEFAULT_FOCUS_SESSION_COUNTDOWN_TIME,
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
  targetWorkMinutesToday: secondsToMinutes(DEFAULT_WORK_SESSION_DURATION), // Convert from seconds
  lastCompletedFocusSessionMinutes: 0,

  // Weight multipliers (default to 1.0)
  fatigueWeightMultiplier: 1.0,
  momentumWeightMultiplier: 1.0,
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
    state.lastCompletedFocusSessionMinutes
  );

  const focusDurationMinutes = calculateFocusSessionDuration(
    state.momentum,
    fatigue,
    progress,
    state.momentumWeightMultiplier,
    state.fatigueWeightMultiplier
  );

  const breakDurationMinutes = calculateBreakDuration(
    fatigue,
    progress,
    state.momentum,
    state.fatigueWeightMultiplier,
    state.momentumWeightMultiplier
  );

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

    setWorkSessionDuration: (state, action: PayloadAction<number>) => {
      const durationInSeconds = action.payload * 60; // Convert minutes to seconds
      state.initialWorkSessionDuration = durationInSeconds;
      state.workSessionDurationRemaining = durationInSeconds;
      state.targetWorkMinutesToday = action.payload;

      // Recalculate next session durations based on new work session duration
      const durations = calculateNextSessionDurations(state);
      state.nextFocusDuration = durations.nextFocusDuration;
      state.nextBreakDuration = durations.nextBreakDuration;
      state.initialFocusSessionDuration = durations.nextFocusDuration;
      state.focusSessionDurationRemaining = durations.nextFocusDuration;
    },

    startFocusSession: (state) => {
      state.sessionState = 'ONGOING_FOCUS_SESSION';
      state.focusSessionDurationRemaining = state.nextFocusDuration;
      state.focusSessionEntryTimeStamp = Date.now();
      state.initialFocusSessionDuration = state.nextFocusDuration;
      state.isPaused = false;
    },

    pauseSession: (state) => {
      if (state.isPaused) return;

      state.isPaused = true;

      // Save current remaining time when pausing
      if (state.sessionState === 'ONGOING_FOCUS_SESSION') {
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
      if (state.sessionState === 'ONGOING_FOCUS_SESSION') {
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
          lastCompletedFocusSessionMinutes: newLastSessionMinutes,
        };
        const durations = calculateNextSessionDurations(tempState);

        if (newWorkRemaining <= 0) {
          return {
            sessionState: 'WORK_SESSION_COMPLETE',
            focusSessionDurationRemaining: durations.nextFocusDuration,
            workSessionDurationRemaining: 0,
            focusSessionEntryTimeStamp: undefined,
            initialFocusSessionDuration: durations.nextFocusDuration,
            lastFocusSessionCompleted: lastCompleted,
            momentum: newMomentum,
            completedWorkMinutesToday: newCompletedWork,
            lastCompletedFocusSessionMinutes: newLastSessionMinutes,
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
          lastCompletedFocusSessionMinutes: newLastSessionMinutes,
          nextFocusDuration: durations.nextFocusDuration,
          nextBreakDuration: durations.nextBreakDuration,
        };
      };

      // Break case
      if (state.sessionState === 'ONGOING_BREAK_SESSION') {
        state.sessionState = 'FOCUS_SESSION_COUNTDOWN';
        state.breakSessionEntryTimeStamp = undefined;
        state.focusSessionCountdownTimeRemaining = DEFAULT_FOCUS_SESSION_COUNTDOWN_TIME;
        state.initialFocusSessionCountdownDuration = DEFAULT_FOCUS_SESSION_COUNTDOWN_TIME;
        state.focusSessionCountdownEntryTimeStamp = Date.now();
        state.isPaused = false;
        return;
      }

      // Session case (ONGOING_FOCUS_SESSION or PAUSED)
      let actualRemaining = state.focusSessionDurationRemaining;
      if (state.sessionState === 'ONGOING_FOCUS_SESSION') {
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
      state.sessionState = 'ONGOING_BREAK_SESSION';
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
      state.sessionState = 'ONGOING_FOCUS_SESSION';
      state.focusSessionDurationRemaining = state.nextFocusDuration;
      state.focusSessionCountdownTimeRemaining = DEFAULT_FOCUS_SESSION_COUNTDOWN_TIME;
      state.initialFocusSessionCountdownDuration = DEFAULT_FOCUS_SESSION_COUNTDOWN_TIME;
      state.focusSessionCountdownEntryTimeStamp = undefined;
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
      state.lastCompletedFocusSessionMinutes = completedMinutes;

      // Calculate next session durations based on updated state
      const durations = calculateNextSessionDurations(state);
      state.nextFocusDuration = durations.nextFocusDuration;
      state.nextBreakDuration = durations.nextBreakDuration;

      if (newWorkRemaining <= 0) {
        state.sessionState = 'WORK_SESSION_COMPLETE';
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

    transitionToFocusSessionCountdown: (state) => {
      state.sessionState = 'FOCUS_SESSION_COUNTDOWN';
      state.breakSessionDurationRemaining = state.nextBreakDuration;
      state.focusSessionCountdownTimeRemaining = DEFAULT_FOCUS_SESSION_COUNTDOWN_TIME;
      state.initialFocusSessionCountdownDuration = DEFAULT_FOCUS_SESSION_COUNTDOWN_TIME;
      state.focusSessionCountdownEntryTimeStamp = Date.now();
      state.breakSessionEntryTimeStamp = undefined;
      state.initialBreakSessionDuration = state.nextBreakDuration;
      state.isPaused = false;
    },

    updateWeightMultipliers: (
      state,
      action: PayloadAction<{ fatigueMultiplier?: number; momentumMultiplier?: number }>
    ) => {
      if (action.payload.fatigueMultiplier !== undefined) {
        state.fatigueWeightMultiplier = action.payload.fatigueMultiplier;
      }
      if (action.payload.momentumMultiplier !== undefined) {
        state.momentumWeightMultiplier = action.payload.momentumMultiplier;
      }

      // Recalculate next session durations with updated weights
      const durations = calculateNextSessionDurations(state);
      state.nextFocusDuration = durations.nextFocusDuration;
      state.nextBreakDuration = durations.nextBreakDuration;
    },
  },
});

export const {
  updateTimerState,
  resetTimer,
  setWorkSessionDuration,
  startFocusSession,
  pauseSession,
  resumeSession,
  endSessionEarly,
  selectReward,
  setGeneratedRewards,
  rerollReward,
  transitionToFocusSession,
  transitionToRewardSelection,
  transitionToFocusSessionCountdown,
  updateWeightMultipliers,
} = timerSlice.actions;

export default timerSlice.reducer;
