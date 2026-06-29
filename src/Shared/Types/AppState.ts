import {
  addBlockListEntry,
  createDefaultBlockListValue,
  removeBlockListEntry,
  type BlockListValue,
} from '@/Background/Services/BlockListManagement/BlockListManagementService';
import {
  createDefaultCoinBalanceValue,
  setCoinBalance,
} from '@/Background/Services/Coin/CoinService';
import {
  createDefaultSchedulerState,
  pauseScheduler,
  resumeScheduler,
  startFocus,
  type SchedulerState,
} from '@/Background/Services/Scheduler/SchedulerService';
import {
  clearWorkStartReminder,
  createDefaultWorkStartReminderValue,
  setWorkStartReminder,
  type WorkStartReminderValue,
} from '@/Background/Services/WorkStartReminder/WorkStartReminderService';
import type { Reward } from './Reward';
import type { QuizOption, QuizResults } from './Quiz';
import { SESSION_STATES, DEFAULT_REROLLS, FOCUS_COUNTDOWN_DURATION } from '../Constants/Constants';
import {
  calculateMomentum,
  calculateFatigue,
  calculateFocusSessionDuration,
} from '../Utils/SessionDurationService';

export const APP_STATE_STORAGE_KEY = 'appState';

export interface WorkstyleProfileValue {
  onboardingCompleted: boolean;
  activePetId: string | null;
}

export interface QuizValue {
  currentQuestionId: string;
  selectedChoices: string[];
  isComplete: boolean;
  results: QuizResults | null;
}

export interface TimerValue {
  sessionState: string;
  isPaused: boolean;
  totalTimer: number;
  totalRemaining: number;
  currentTimer: number;
  currentTimerRemaining: number;
  currentStartTime: number | undefined;
  rerolls: number;
  selectedReward: Reward | null;
  shownRewardCombinations: string[];
  generatedRewards: Reward[];
  lastFocusSessionCompleted: boolean;
  momentumScore: number;
  fatigueScore: number;
  lastFocusSessionDuration: number;
  feedbackMultiplier: number;
}

export interface PersistedAppState {
  blockList: BlockListValue;
  coin: number;
  scheduler: SchedulerState;
  workStartReminder: WorkStartReminderValue;
  workstyleProfile: WorkstyleProfileValue;
  quiz: QuizValue;
  timer: TimerValue;
}

export type EnergyLevel = 'low' | 'steady' | 'high';
export type PreferredCadence = '15/5' | '25/5' | '45/10';
export type FrictionDimension =
  | 'emotional-load'
  | 'motivation'
  | 'organization'
  | 'distraction'
  | 'starting'
  | 'fatigue';

export type AppAction =
  | { type: 'ADD_BLOCKED_SITE'; hostname: string }
  | { type: 'REMOVE_BLOCKED_SITE'; hostname: string }
  | { type: 'START_FOCUS' }
  | { type: 'PAUSE_SCHEDULER' }
  | { type: 'RESUME_SCHEDULER' }
  | { type: 'SET_WORK_START_REMINDER'; startsAt: string }
  | { type: 'CLEAR_WORK_START_REMINDER' }
  | { type: 'SET_COIN_BALANCE'; balance: number }
  | {
      type: 'INITIALIZE_FROM_ONBOARDING';
      energy: EnergyLevel;
      cadence: PreferredCadence;
      primaryFriction: FrictionDimension;
    }
  | { type: 'TIMER_START_FOCUS_SESSION' }
  | { type: 'TIMER_PAUSE_SESSION'; remaining: number }
  | { type: 'TIMER_RESUME_SESSION' }
  | { type: 'TIMER_END_SESSION_EARLY' }
  | { type: 'TIMER_END_WORK_SESSION_EARLY' }
  | { type: 'TIMER_SELECT_REWARD'; reward: Reward }
  | { type: 'TIMER_SET_TOTAL_TIMER'; duration: number }
  | { type: 'TIMER_TRANSITION_TO_FOCUS_SESSION' }
  | { type: 'TIMER_TRANSITION_TO_REWARD_SELECTION' }
  | { type: 'TIMER_TRANSITION_TO_BEFORE_WORK_SESSION' }
  | { type: 'TIMER_TRANSITION_TO_FOCUS_SESSION_COUNTDOWN' }
  | { type: 'TIMER_UPDATE_FEEDBACK_MULTIPLIER'; multiplier: number }
  | { type: 'TIMER_SET_GENERATED_REWARDS'; rewards: Reward[] }
  | { type: 'TIMER_SET_SHOWN_REWARD_COMBINATIONS'; combinations: string[] }
  | { type: 'TIMER_REROLL_REWARD'; index: number; reward: Reward }
  | { type: 'QUIZ_SELECT_OPTION'; option: QuizOption }
  | { type: 'QUIZ_RESTART' };

export type AppStateMessage =
  | { type: 'GET_APP_STATE' }
  | { type: 'APP_ACTION'; action: AppAction }
  | { type: 'APP_STATE_CHANGED'; state: PersistedAppState };

export type AppActionResponse = { ok: true } | { ok: false; error: 'invalid-action' };

export const createDefaultPersistedAppState = (): PersistedAppState => ({
  blockList: createDefaultBlockListValue(),
  coin: createDefaultCoinBalanceValue(),
  scheduler: createDefaultSchedulerState(),
  workStartReminder: createDefaultWorkStartReminderValue(),
  workstyleProfile: {
    onboardingCompleted: false,
    activePetId: null,
  },
  quiz: {
    currentQuestionId: 'Q1',
    selectedChoices: [],
    isComplete: false,
    results: null,
  },
  timer: {
    sessionState: SESSION_STATES.BEFORE_WORK_SESSION,
    isPaused: false,
    totalTimer: 0,
    totalRemaining: 0,
    currentTimer: 0,
    currentTimerRemaining: 0,
    currentStartTime: undefined,
    rerolls: 3,
    selectedReward: null,
    shownRewardCombinations: [],
    generatedRewards: [],
    lastFocusSessionCompleted: false,
    momentumScore: 1,
    fatigueScore: 0,
    lastFocusSessionDuration: 0,
    feedbackMultiplier: 1.0,
  },
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const isPersistedAppState = (value: unknown): value is PersistedAppState =>
  isRecord(value) &&
  isRecord(value.blockList) &&
  Array.isArray(value.blockList.entries) &&
  isRecord(value.coin) &&
  typeof value.coin.balance === 'number' &&
  isRecord(value.scheduler) &&
  typeof value.scheduler.status === 'string' &&
  isRecord(value.workStartReminder) &&
  (typeof value.workStartReminder.startsAt === 'string' ||
    value.workStartReminder.startsAt === null) &&
  isRecord(value.timer) &&
  typeof value.timer.sessionState === 'string';

export const applyAppAction = (
  state: PersistedAppState,
  action: AppAction,
  now: Date
): PersistedAppState => {
  if (action.type === 'ADD_BLOCKED_SITE') {
    return {
      ...state,
      blockList: addBlockListEntry(state.blockList, action.hostname),
    };
  }

  if (action.type === 'REMOVE_BLOCKED_SITE') {
    return {
      ...state,
      blockList: removeBlockListEntry(state.blockList, action.hostname),
    };
  }

  if (action.type === 'START_FOCUS') {
    return { ...state, scheduler: startFocus(now) };
  }

  if (action.type === 'PAUSE_SCHEDULER') {
    return { ...state, scheduler: pauseScheduler(state.scheduler, now) };
  }

  if (action.type === 'RESUME_SCHEDULER') {
    return { ...state, scheduler: resumeScheduler(state.scheduler, now) };
  }

  if (action.type === 'SET_WORK_START_REMINDER') {
    return {
      ...state,
      workStartReminder: setWorkStartReminder(new Date(action.startsAt)),
    };
  }

  if (action.type === 'CLEAR_WORK_START_REMINDER') {
    return { ...state, workStartReminder: clearWorkStartReminder() };
  }

  if (action.type === 'SET_COIN_BALANCE') {
    return {
      ...state,
      coin: setCoinBalance(state.coin, action.balance),
    };
  }

  if (action.type === 'INITIALIZE_FROM_ONBOARDING') {
    return {
      ...state,
      workstyleProfile: {
        ...state.workstyleProfile,
        onboardingCompleted: true,
      },
    };
  }

  // --- Timer actions ---
  if (action.type === 'TIMER_START_FOCUS_SESSION') {
    return { ...state, timer: startFocusSession(state.timer) };
  }
  if (action.type === 'TIMER_PAUSE_SESSION') {
    return { ...state, timer: pauseSession(state.timer, action.remaining) };
  }
  if (action.type === 'TIMER_RESUME_SESSION') {
    return { ...state, timer: resumeSession(state.timer) };
  }
  if (action.type === 'TIMER_END_SESSION_EARLY') {
    return { ...state, timer: endSessionEarly(state.timer) };
  }
  if (action.type === 'TIMER_END_WORK_SESSION_EARLY') {
    return { ...state, timer: endWorkSessionEarly(state.timer) };
  }
  if (action.type === 'TIMER_SELECT_REWARD') {
    return { ...state, timer: selectReward(state.timer, action.reward) };
  }
  if (action.type === 'TIMER_SET_TOTAL_TIMER') {
    return { ...state, timer: setTotalTimer(state.timer, action.duration) };
  }
  if (action.type === 'TIMER_TRANSITION_TO_FOCUS_SESSION') {
    return { ...state, timer: transitionToFocusSession(state.timer) };
  }
  if (action.type === 'TIMER_TRANSITION_TO_REWARD_SELECTION') {
    return { ...state, timer: transitionToRewardSelection(state.timer) };
  }
  if (action.type === 'TIMER_TRANSITION_TO_BEFORE_WORK_SESSION') {
    return { ...state, timer: transitionToBeforeWorkSession(state.timer) };
  }
  if (action.type === 'TIMER_TRANSITION_TO_FOCUS_SESSION_COUNTDOWN') {
    return { ...state, timer: transitionToFocusSessionCountdown(state.timer) };
  }
  if (action.type === 'TIMER_UPDATE_FEEDBACK_MULTIPLIER') {
    return { ...state, timer: updateFeedbackMultiplier(state.timer, action.multiplier) };
  }
  if (action.type === 'TIMER_SET_GENERATED_REWARDS') {
    return { ...state, timer: { ...state.timer, generatedRewards: action.rewards } };
  }
  if (action.type === 'TIMER_SET_SHOWN_REWARD_COMBINATIONS') {
    return { ...state, timer: { ...state.timer, shownRewardCombinations: action.combinations } };
  }
  if (action.type === 'TIMER_REROLL_REWARD') {
    return { ...state, timer: rerollReward(state.timer, action.index, action.reward) };
  }

  // --- Quiz actions ---
  if (action.type === 'QUIZ_SELECT_OPTION') {
    return { ...state, quiz: selectQuizOption(state.quiz, action.option) };
  }
  if (action.type === 'QUIZ_RESTART') {
    return {
      ...state,
      quiz: { currentQuestionId: 'Q1', selectedChoices: [], isComplete: false, results: null },
    };
  }

  return state;
};

// --- Timer pure functions ---

const setCurrentSessionDuration = (timer: TimerValue, duration: number): void => {
  timer.currentTimer = duration;
  timer.currentTimerRemaining = duration;
};

const startFocusSession = (timer: TimerValue): TimerValue => {
  const nextFocusSessionDuration = calculateFocusSessionDuration(
    timer.totalTimer,
    timer.totalRemaining,
    timer.momentumScore,
    timer.fatigueScore
  );
  return {
    ...timer,
    sessionState: SESSION_STATES.ONGOING_FOCUS_SESSION,
    currentTimer: nextFocusSessionDuration,
    currentTimerRemaining: nextFocusSessionDuration,
    currentStartTime: Date.now(),
    isPaused: false,
    rerolls: DEFAULT_REROLLS,
    generatedRewards: [],
    shownRewardCombinations: [],
  };
};

const pauseSession = (timer: TimerValue, remaining: number): TimerValue => {
  if (timer.isPaused || timer.sessionState !== SESSION_STATES.ONGOING_FOCUS_SESSION) {
    return timer;
  }
  return {
    ...timer,
    isPaused: true,
    currentTimerRemaining: remaining,
    currentStartTime: undefined,
  };
};

const resumeSession = (timer: TimerValue): TimerValue => {
  if (!timer.isPaused || timer.sessionState !== SESSION_STATES.ONGOING_FOCUS_SESSION) {
    return timer;
  }
  return {
    ...timer,
    isPaused: false,
    currentStartTime: Date.now(),
  };
};

const endSessionEarly = (timer: TimerValue): TimerValue => {
  if (timer.sessionState === SESSION_STATES.ONGOING_BREAK_SESSION) {
    return enterFocusCountdown(timer);
  }
  if (timer.sessionState === SESSION_STATES.ONGOING_FOCUS_SESSION) {
    const lastFocusSessionCompleted = false;
    const momentumScore = calculateMomentum(
      timer.momentumScore,
      lastFocusSessionCompleted,
      timer.feedbackMultiplier
    );
    const lastFocusSessionDuration = timer.currentTimer - timer.currentTimerRemaining;
    const totalRemaining = Math.max(0, timer.totalRemaining - lastFocusSessionDuration);
    const fatigueScore = calculateFatigue(
      timer.totalTimer,
      totalRemaining,
      lastFocusSessionDuration,
      lastFocusSessionCompleted
    );
    const sessionDuration = calculateFocusSessionDuration(
      timer.totalTimer,
      totalRemaining,
      momentumScore,
      fatigueScore
    );
    return buildRewardOrComplete({
      ...timer,
      lastFocusSessionCompleted,
      momentumScore,
      fatigueScore,
      lastFocusSessionDuration,
      totalRemaining,
      currentTimer: sessionDuration,
      currentTimerRemaining: sessionDuration,
    });
  }
  return timer;
};

const endWorkSessionEarly = (timer: TimerValue): TimerValue => ({
  ...timer,
  totalRemaining: 0,
  currentStartTime: undefined,
  isPaused: false,
  currentTimer: 0,
  currentTimerRemaining: 0,
  selectedReward: null,
  lastFocusSessionCompleted: false,
  sessionState: SESSION_STATES.WORK_SESSION_COMPLETE,
  rerolls: DEFAULT_REROLLS,
  generatedRewards: [],
  shownRewardCombinations: [],
});

const selectReward = (timer: TimerValue, reward: Reward): TimerValue => ({
  ...timer,
  selectedReward: reward,
  sessionState: SESSION_STATES.ONGOING_BREAK_SESSION,
  currentTimer: reward.duration,
  currentTimerRemaining: reward.duration,
  currentStartTime: Date.now(),
  isPaused: false,
  rerolls: DEFAULT_REROLLS,
  generatedRewards: [],
  shownRewardCombinations: [],
});

const setTotalTimer = (timer: TimerValue, duration: number): TimerValue => {
  const next = {
    ...timer,
    totalTimer: duration,
    totalRemaining: duration,
  };
  if (timer.sessionState === SESSION_STATES.BEFORE_WORK_SESSION) {
    const nextFocusSessionDuration = calculateFocusSessionDuration(
      next.totalTimer,
      next.totalRemaining,
      next.momentumScore,
      next.fatigueScore
    );
    setCurrentSessionDuration(next, nextFocusSessionDuration);
  }
  return next;
};

const transitionToFocusSession = (timer: TimerValue): TimerValue => startFocusSession(timer);

const transitionToBeforeWorkSession = (timer: TimerValue): TimerValue => {
  const nextFocusSessionDuration = calculateFocusSessionDuration(
    timer.totalTimer,
    timer.totalRemaining,
    timer.momentumScore,
    timer.fatigueScore
  );
  return {
    ...timer,
    sessionState: SESSION_STATES.BEFORE_WORK_SESSION,
    currentTimer: nextFocusSessionDuration,
    currentTimerRemaining: nextFocusSessionDuration,
    currentStartTime: undefined,
    isPaused: false,
    selectedReward: null,
    lastFocusSessionCompleted: false,
    rerolls: DEFAULT_REROLLS,
    generatedRewards: [],
    shownRewardCombinations: [],
  };
};

const enterFocusCountdown = (timer: TimerValue): TimerValue => ({
  ...timer,
  sessionState: SESSION_STATES.FOCUS_SESSION_COUNTDOWN,
  currentTimer: FOCUS_COUNTDOWN_DURATION,
  currentTimerRemaining: FOCUS_COUNTDOWN_DURATION,
  currentStartTime: Date.now(),
  isPaused: false,
  rerolls: DEFAULT_REROLLS,
  generatedRewards: [],
  shownRewardCombinations: [],
});

const transitionToRewardSelection = (timer: TimerValue): TimerValue => {
  const momentumScore = calculateMomentum(timer.momentumScore, true, timer.feedbackMultiplier);
  const lastFocusSessionDuration = timer.currentTimer;
  const totalRemaining = Math.max(0, timer.totalRemaining - timer.currentTimer);
  const fatigueScore = calculateFatigue(
    timer.totalTimer,
    totalRemaining,
    lastFocusSessionDuration,
    timer.lastFocusSessionCompleted
  );
  const nextFocusSessionDuration = calculateFocusSessionDuration(
    timer.totalTimer,
    totalRemaining,
    momentumScore,
    fatigueScore
  );
  return buildRewardOrComplete({
    ...timer,
    momentumScore,
    fatigueScore,
    lastFocusSessionDuration,
    totalRemaining,
    currentTimer: nextFocusSessionDuration,
    currentTimerRemaining: nextFocusSessionDuration,
  });
};

const transitionToFocusSessionCountdown = (timer: TimerValue): TimerValue =>
  enterFocusCountdown(timer);

const updateFeedbackMultiplier = (timer: TimerValue, multiplier: number): TimerValue => {
  const next = { ...timer, feedbackMultiplier: multiplier };
  if (timer.sessionState === SESSION_STATES.BEFORE_WORK_SESSION) {
    next.currentTimer = calculateFocusSessionDuration(
      next.totalTimer,
      next.totalRemaining,
      next.momentumScore,
      next.fatigueScore
    );
  }
  return next;
};

const rerollReward = (timer: TimerValue, index: number, reward: Reward): TimerValue => {
  if (timer.rerolls <= 0) return timer;
  const generatedRewards = [...timer.generatedRewards];
  generatedRewards[index] = reward;
  return { ...timer, generatedRewards, rerolls: timer.rerolls - 1 };
};

const buildRewardOrComplete = (timer: TimerValue): TimerValue => {
  if (timer.totalRemaining <= 0) {
    return {
      ...timer,
      sessionState: SESSION_STATES.WORK_SESSION_COMPLETE,
      totalRemaining: 0,
      currentStartTime: undefined,
      currentTimer: 0,
      currentTimerRemaining: 0,
      lastFocusSessionCompleted: true,
      isPaused: false,
      rerolls: DEFAULT_REROLLS,
      generatedRewards: [],
      shownRewardCombinations: [],
    };
  }
  return {
    ...timer,
    sessionState: SESSION_STATES.REWARD_SELECTION,
    currentStartTime: undefined,
    currentTimer: 0,
    currentTimerRemaining: 0,
    lastFocusSessionCompleted: true,
    isPaused: false,
    rerolls: DEFAULT_REROLLS,
    generatedRewards: [],
    shownRewardCombinations: [],
  };
};

// --- Quiz pure functions ---

const selectQuizOption = (quiz: QuizValue, option: QuizOption): QuizValue => {
  const selectedChoices = [...quiz.selectedChoices, option.id];
  return {
    ...quiz,
    selectedChoices,
    currentQuestionId: option.next,
    isComplete: option.next === 'COMPLETE',
  };
};
