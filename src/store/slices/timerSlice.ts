import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TimerState, Reward } from '../../storage/types';
import {
  DEFAULT_FOCUS_TIME,
  DEFAULT_BREAK_TIME,
  DEFAULT_BACK_TO_IT_TIME,
  DEFAULT_REROLLS,
  DEFAULT_TOTAL_WORK_DURATION,
} from '../../storage/constants';

const initialState: TimerState = {
  sessionState: 'BEFORE_SESSION',
  initialWorkSessionDuration: DEFAULT_TOTAL_WORK_DURATION,
  workSessionDurationRemaining: DEFAULT_TOTAL_WORK_DURATION,
  initialFocusSessionDuration: DEFAULT_FOCUS_TIME,
  initialBreakSessionDuration: DEFAULT_BREAK_TIME,
  focusSessionDurationRemaining: DEFAULT_FOCUS_TIME,
  breakSessionDurationRemaining: DEFAULT_BREAK_TIME,

  backToItTimeRemaining: DEFAULT_BACK_TO_IT_TIME,
  rerolls: DEFAULT_REROLLS,
  selectedReward: null,
  pausedFrom: null,

  nextFocusDuration: DEFAULT_FOCUS_TIME,
  nextBreakDuration: DEFAULT_BREAK_TIME,
  lastFocusSessionCompleted: false,
  generatedRewards: [],
};

const timerSlice = createSlice({
  name: 'timer',
  initialState,
  reducers: {
    // Update timer state with partial updates
    updateTimerState: (state, action: PayloadAction<Partial<TimerState>>) => {
      return { ...state, ...action.payload };
    },

    // Reset timer to initial state
    resetTimer: () => initialState,

    // Start focus session
    startFocusSession: (state) => {
      state.sessionState = 'DURING_SESSION';
      state.focusSessionDurationRemaining = DEFAULT_FOCUS_TIME;
      state.focusSessionEntryTimeStamp = Date.now();
      state.initialFocusSessionDuration = DEFAULT_FOCUS_TIME;
    },

    // Pause session
    pauseSession: (state) => {
      const calculateRemaining = (initialDuration: number, entryTimeStamp?: number): number => {
        if (!entryTimeStamp) return initialDuration;
        const currentTime = Date.now();
        const elapsed = Math.floor((currentTime - entryTimeStamp) / 1000);
        return Math.max(0, initialDuration - elapsed);
      };

      let currentRemaining = state.focusSessionDurationRemaining;
      if (state.sessionState === 'DURING_SESSION') {
        currentRemaining = calculateRemaining(
          state.initialFocusSessionDuration,
          state.focusSessionEntryTimeStamp
        );
      }

      let pausedFrom = state.sessionState as 'DURING_SESSION' | 'BACK_TO_IT';
      if (state.sessionState !== 'DURING_SESSION' && state.sessionState !== 'BACK_TO_IT') {
        if (state.sessionState === 'PAUSED') return;
        pausedFrom = 'DURING_SESSION';
      }

      state.sessionState = 'PAUSED';
      state.focusSessionDurationRemaining = currentRemaining;
      state.focusSessionEntryTimeStamp = undefined;
      state.pausedFrom = pausedFrom;
    },

    // Resume session
    resumeSession: (state) => {
      const resumeTo = state.pausedFrom || 'DURING_SESSION';

      if (resumeTo === 'BACK_TO_IT') {
        state.sessionState = 'BACK_TO_IT';
        state.pausedFrom = null;
      } else {
        state.sessionState = 'DURING_SESSION';
        state.focusSessionEntryTimeStamp = Date.now();
        state.initialFocusSessionDuration = state.focusSessionDurationRemaining;
        state.pausedFrom = null;
      }
    },

    // End session early
    endSessionEarly: (state) => {
      const calculateRemaining = (initialDuration: number, entryTimeStamp?: number): number => {
        if (!entryTimeStamp) return initialDuration;
        const currentTime = Date.now();
        const elapsed = Math.floor((currentTime - entryTimeStamp) / 1000);
        return Math.max(0, initialDuration - elapsed);
      };

      const getNextFocusState = (
        currentWorkRemaining: number,
        initialFocusDuration: number,
        actualFocusRemaining: number,
        lastCompleted: boolean,
        nextFocusDuration: number
      ): Partial<TimerState> => {
        const completedInSegment = Math.max(0, initialFocusDuration - actualFocusRemaining);
        const newWorkRemaining = Math.max(0, currentWorkRemaining - completedInSegment);

        if (newWorkRemaining <= 0) {
          return {
            sessionState: 'SESSION_COMPLETE',
            focusSessionDurationRemaining: nextFocusDuration,
            workSessionDurationRemaining: 0,
            focusSessionEntryTimeStamp: undefined,
            initialFocusSessionDuration: nextFocusDuration,
            lastFocusSessionCompleted: lastCompleted,
          };
        }

        return {
          sessionState: 'REWARD_SELECTION',
          focusSessionDurationRemaining: nextFocusDuration,
          workSessionDurationRemaining: newWorkRemaining,
          focusSessionEntryTimeStamp: undefined,
          initialFocusSessionDuration: nextFocusDuration,
          lastFocusSessionCompleted: lastCompleted,
        };
      };

      // Break case
      if (state.sessionState === 'BREAK') {
        state.sessionState = 'BACK_TO_IT';
        state.breakSessionEntryTimeStamp = undefined;
        state.backToItTimeRemaining = DEFAULT_BACK_TO_IT_TIME;
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
        false,
        state.nextFocusDuration
      );

      Object.assign(state, nextState);
    },

    // Select reward and start break
    selectReward: (state, action: PayloadAction<Reward>) => {
      const reward = action.payload;
      state.selectedReward = reward;
      state.breakSessionDurationRemaining = reward.durationSeconds;
      state.sessionState = 'BREAK';
      state.breakSessionEntryTimeStamp = Date.now();
      state.initialBreakSessionDuration = reward.durationSeconds;
      state.nextBreakDuration = reward.durationSeconds;
    },

    // Set generated rewards
    setGeneratedRewards: (state, action: PayloadAction<Reward[]>) => {
      state.generatedRewards = action.payload;
    },

    // Reroll a specific reward
    rerollReward: (state, action: PayloadAction<{ index: number; newReward: Reward }>) => {
      if (state.rerolls > 0) {
        state.generatedRewards[action.payload.index] = action.payload.newReward;
        state.rerolls -= 1;
      }
    },

    // Decrement back to it timer
    decrementBackToIt: (state) => {
      if (state.backToItTimeRemaining > 0) {
        state.backToItTimeRemaining -= 1;
      }
    },

    // Transition from BACK_TO_IT to DURING_SESSION
    transitionToFocusSession: (state) => {
      state.sessionState = 'DURING_SESSION';
      state.focusSessionDurationRemaining = state.nextFocusDuration;
      state.backToItTimeRemaining = DEFAULT_BACK_TO_IT_TIME;
      state.focusSessionEntryTimeStamp = Date.now();
      state.initialFocusSessionDuration = state.nextFocusDuration;
    },

    // Transition from DURING_SESSION to REWARD_SELECTION (timer naturally expired)
    transitionToRewardSelection: (state) => {
      const completedInSegment = state.initialFocusSessionDuration;
      const newWorkRemaining = Math.max(0, state.workSessionDurationRemaining - completedInSegment);

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
    },

    // Transition from BREAK to BACK_TO_IT
    transitionToBackToIt: (state) => {
      state.sessionState = 'BACK_TO_IT';
      state.breakSessionDurationRemaining = state.nextBreakDuration;
      state.backToItTimeRemaining = DEFAULT_BACK_TO_IT_TIME;
      state.breakSessionEntryTimeStamp = undefined;
      state.initialBreakSessionDuration = state.nextBreakDuration;
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
  decrementBackToIt,
  transitionToFocusSession,
  transitionToRewardSelection,
  transitionToBackToIt,
} = timerSlice.actions;

export default timerSlice.reducer;
