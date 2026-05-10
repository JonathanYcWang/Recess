import { createReducer } from '@reduxjs/toolkit';
import { TimerState } from '../../types/timer';
import { Reward } from '../../types/reward';
import {
  DEFAULT_FOCUS_SESSION_COUNTDOWN_TIME,
  DEFAULT_REROLLS,
  DEFAULT_WORK_SESSION_DURATION,
} from '../../constants/constants';
import { calculateRemaining } from '../../services/timerService';
import {
  calculateBreakDuration,
  calculateFatigue,
  calculateFocusSessionDuration,
  calculateProgress,
  getInitialCEWMA,
  minutesToSeconds,
  secondsToMinutes,
  updateCEWMA,
} from '../../services/sessionDurationService';
import {
  addShownRewardCombination,
  completeWorkSessionEarly,
  endSessionEarly,
  pauseSession,
  rerollReward,
  resetTimer,
  resumeSession,
  selectReward,
  setGeneratedRewards,
  setWorkSessionDuration,
  startFocusSession,
  transitionToFocusSession,
  transitionToFocusSessionCountdown,
  transitionToRewardSelection,
  updateTimerState,
  updateWeightMultipliers,
} from '../actions/timerActions';

const initialState: TimerState = {
  sessionState: 'BEFORE_WORK_SESSION',
  isPaused: false,
  initialWorkSessionDuration: DEFAULT_WORK_SESSION_DURATION,
  workSessionDurationRemaining: DEFAULT_WORK_SESSION_DURATION,
  initialFocusSessionDuration: 0,
  initialBreakSessionDuration: 0,
  focusSessionDurationRemaining: 0,
  breakSessionDurationRemaining: 0,

  focusSessionCountdownTimeRemaining: DEFAULT_FOCUS_SESSION_COUNTDOWN_TIME,
  initialFocusSessionCountdownDuration: DEFAULT_FOCUS_SESSION_COUNTDOWN_TIME,
  rerolls: DEFAULT_REROLLS,
  selectedReward: null,
  shownRewardCombinations: [],

  nextFocusDuration: 0,
  nextBreakDuration: 0,
  lastFocusSessionCompleted: false,
  generatedRewards: [],

  momentum: getInitialCEWMA(),
  completedWorkMinutesToday: 0,
  targetWorkMinutesToday: secondsToMinutes(DEFAULT_WORK_SESSION_DURATION),
  lastCompletedFocusSessionMinutes: 0,

  fatigueWeightMultiplier: 1.0,
  momentumWeightMultiplier: 1.0,
};

const calculateNextSessionDurations = (state: TimerState): {
  nextFocusDuration: number;
  nextBreakDuration: number;
} => {
  const progress = calculateProgress(state.completedWorkMinutesToday, state.targetWorkMinutesToday);
  const fatigue = calculateFatigue(
    state.completedWorkMinutesToday,
    state.targetWorkMinutesToday,
    state.lastCompletedFocusSessionMinutes
  );

  const FOCUS_INTERVAL = 5;
  const BREAK_INTERVAL = 5;
  const roundToInterval = (value: number, interval: number) =>
    Math.round(value / interval) * interval;

  let focusDurationMinutes = roundToInterval(
    calculateFocusSessionDuration(
      state.momentum,
      fatigue,
      progress,
      state.momentumWeightMultiplier,
      state.fatigueWeightMultiplier
    ),
    FOCUS_INTERVAL
  );
  let breakDurationMinutes = roundToInterval(
    calculateBreakDuration(
      fatigue,
      progress,
      state.momentum,
      state.fatigueWeightMultiplier,
      state.momentumWeightMultiplier
    ),
    BREAK_INTERVAL
  );

  const workSessionMinutesLeft = state.workSessionDurationRemaining / 60;
  if (workSessionMinutesLeft < FOCUS_INTERVAL) {
    focusDurationMinutes += workSessionMinutesLeft;
  }

  let focusDurationSeconds = minutesToSeconds(focusDurationMinutes);
  if (focusDurationSeconds > state.workSessionDurationRemaining) {
    focusDurationSeconds = state.workSessionDurationRemaining;
  }

  return {
    nextFocusDuration: focusDurationSeconds,
    nextBreakDuration: minutesToSeconds(breakDurationMinutes),
  };
};

const initialDurations = calculateNextSessionDurations(initialState);
initialState.nextFocusDuration = initialDurations.nextFocusDuration;
initialState.nextBreakDuration = initialDurations.nextBreakDuration;
initialState.initialFocusSessionDuration = initialDurations.nextFocusDuration;
initialState.initialBreakSessionDuration = initialDurations.nextBreakDuration;
initialState.focusSessionDurationRemaining = initialDurations.nextFocusDuration;
initialState.breakSessionDurationRemaining = initialDurations.nextBreakDuration;

const timerReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(updateTimerState, (state, action) => ({ ...state, ...action.payload }))
    .addCase(resetTimer, () => initialState)
    .addCase(setWorkSessionDuration, (state, action) => {
      const durationInSeconds = action.payload * 60;
      state.initialWorkSessionDuration = durationInSeconds;
      state.workSessionDurationRemaining = durationInSeconds;
      state.targetWorkMinutesToday = action.payload;

      const durations = calculateNextSessionDurations(state);
      state.nextFocusDuration = durations.nextFocusDuration;
      state.nextBreakDuration = durations.nextBreakDuration;
      state.initialFocusSessionDuration = durations.nextFocusDuration;
      state.focusSessionDurationRemaining = durations.nextFocusDuration;
    })
    .addCase(startFocusSession, (state) => {
      state.sessionState = 'ONGOING_FOCUS_SESSION';
      state.focusSessionDurationRemaining = state.nextFocusDuration;
      state.focusSessionEntryTimeStamp = Date.now();
      state.initialFocusSessionDuration = state.nextFocusDuration;
      state.isPaused = false;
    })
    .addCase(pauseSession, (state) => {
      if (state.isPaused || state.sessionState !== 'ONGOING_FOCUS_SESSION') return;

      state.isPaused = true;
      state.focusSessionDurationRemaining = calculateRemaining(
        state.initialFocusSessionDuration,
        state.focusSessionEntryTimeStamp
      );
      state.focusSessionEntryTimeStamp = undefined;
    })
    .addCase(resumeSession, (state) => {
      if (!state.isPaused || state.sessionState !== 'ONGOING_FOCUS_SESSION') return;

      state.isPaused = false;
      state.focusSessionEntryTimeStamp = Date.now();
      state.initialFocusSessionDuration = state.focusSessionDurationRemaining;
    })
    .addCase(endSessionEarly, (state) => {
      const getNextFocusState = (
        currentWorkRemaining: number,
        initialFocusDuration: number,
        actualFocusRemaining: number,
        lastCompleted: boolean
      ): Partial<TimerState> => {
        const completedInSegment = Math.max(0, initialFocusDuration - actualFocusRemaining);
        const newWorkRemaining = Math.max(0, currentWorkRemaining - completedInSegment);

        const newMomentum = updateCEWMA(state.momentum, false);

        const completedMinutes = secondsToMinutes(completedInSegment);
        const newCompletedWork = state.completedWorkMinutesToday + completedMinutes;
        const newLastSessionMinutes = completedMinutes;

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
            rerolls: DEFAULT_REROLLS,
            shownRewardCombinations: [],
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
          rerolls: DEFAULT_REROLLS,
          shownRewardCombinations: [],
        };
      };

      if (state.sessionState === 'ONGOING_BREAK_SESSION') {
        state.sessionState = 'FOCUS_SESSION_COUNTDOWN';
        state.breakSessionEntryTimeStamp = undefined;
        state.focusSessionCountdownTimeRemaining = DEFAULT_FOCUS_SESSION_COUNTDOWN_TIME;
        state.initialFocusSessionCountdownDuration = DEFAULT_FOCUS_SESSION_COUNTDOWN_TIME;
        state.focusSessionCountdownEntryTimeStamp = Date.now();
        state.isPaused = false;
        return;
      }

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
    })
    .addCase(selectReward, (state, action) => {
      const reward: Reward = action.payload;
      state.selectedReward = reward;
      state.breakSessionDurationRemaining = reward.durationSeconds;
      state.sessionState = 'ONGOING_BREAK_SESSION';
      state.breakSessionEntryTimeStamp = Date.now();
      state.initialBreakSessionDuration = reward.durationSeconds;
      state.nextBreakDuration = reward.durationSeconds;
      state.generatedRewards = [];
      state.shownRewardCombinations = [];
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
      state.sessionState = 'ONGOING_FOCUS_SESSION';
      state.focusSessionDurationRemaining = state.nextFocusDuration;
      state.focusSessionCountdownTimeRemaining = DEFAULT_FOCUS_SESSION_COUNTDOWN_TIME;
      state.initialFocusSessionCountdownDuration = DEFAULT_FOCUS_SESSION_COUNTDOWN_TIME;
      state.focusSessionCountdownEntryTimeStamp = undefined;
      state.focusSessionEntryTimeStamp = Date.now();
      state.initialFocusSessionDuration = state.nextFocusDuration;
      state.generatedRewards = [];
    })
    .addCase(transitionToRewardSelection, (state) => {
      const completedInSegment = state.initialFocusSessionDuration;
      const newWorkRemaining = Math.max(0, state.workSessionDurationRemaining - completedInSegment);

      state.momentum = updateCEWMA(state.momentum, true);

      const completedMinutes = secondsToMinutes(completedInSegment);
      state.completedWorkMinutesToday += completedMinutes;
      state.lastCompletedFocusSessionMinutes = completedMinutes;

      state.rerolls = DEFAULT_REROLLS;
      state.shownRewardCombinations = [];

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
    })
    .addCase(transitionToFocusSessionCountdown, (state) => {
      state.sessionState = 'FOCUS_SESSION_COUNTDOWN';
      state.breakSessionDurationRemaining = state.nextBreakDuration;
      state.focusSessionCountdownTimeRemaining = DEFAULT_FOCUS_SESSION_COUNTDOWN_TIME;
      state.initialFocusSessionCountdownDuration = DEFAULT_FOCUS_SESSION_COUNTDOWN_TIME;
      state.focusSessionCountdownEntryTimeStamp = Date.now();
      state.breakSessionEntryTimeStamp = undefined;
      state.initialBreakSessionDuration = state.nextBreakDuration;
      state.isPaused = false;
      state.generatedRewards = [];
    })
    .addCase(updateWeightMultipliers, (state, action) => {
      if (action.payload.fatigueMultiplier !== undefined) {
        state.fatigueWeightMultiplier = action.payload.fatigueMultiplier;
      }
      if (action.payload.momentumMultiplier !== undefined) {
        state.momentumWeightMultiplier = action.payload.momentumMultiplier;
      }

      const durations = calculateNextSessionDurations(state);
      state.nextFocusDuration = durations.nextFocusDuration;
      state.nextBreakDuration = durations.nextBreakDuration;
    })
    .addCase(completeWorkSessionEarly, (state) => {
      state.sessionState = 'WORK_SESSION_COMPLETE';
      state.workSessionDurationRemaining = 0;
      state.focusSessionDurationRemaining = 0;
      state.breakSessionDurationRemaining = 0;
      state.focusSessionEntryTimeStamp = undefined;
      state.breakSessionEntryTimeStamp = undefined;
      state.focusSessionCountdownEntryTimeStamp = undefined;
      state.isPaused = false;
      state.generatedRewards = [];
      state.rerolls = DEFAULT_REROLLS;
      state.shownRewardCombinations = [];
    });
});

export default timerReducer;
