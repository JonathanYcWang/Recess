import {
  CEWMA_ALPHA,
  DEFAULT_REROLLS,
  DEFAULT_WORK_SESSION_DURATION,
  SESSION_STATES,
} from '../Shared/Constants/Constants';
import { calculateFocusSessionDuration } from '../Shared/Utils/SessionDurationService';
import type { TimerState } from '../Shared/Types/Timer';
import type { BlockedSitesState } from './actions/blockedSitesActions';
import type { QuizReduxState } from './actions/quizActions';

const DEFAULT_BLOCKED_SITES = [
  'youtube.com',
  'instagram.com',
  'facebook.com',
  'messenger.com',
  'web.whatsapp.com',
  'discord.com',
  'tiktok.com',
  'netflix.com',
  'primevideo.com',
  'amazon.com',
  'reddit.com',
];

export const createInitialBlockedSitesState = (): BlockedSitesState => [...DEFAULT_BLOCKED_SITES];

export const createInitialTimerState = (): TimerState => {
  const base: TimerState = {
    sessionState: SESSION_STATES.BEFORE_WORK_SESSION,
    isPaused: false,

    totalTimer: DEFAULT_WORK_SESSION_DURATION,
    totalRemaining: DEFAULT_WORK_SESSION_DURATION,

    currentTimer: 0,
    currentTimerRemaining: 0,

    rerolls: DEFAULT_REROLLS,
    selectedReward: null,
    shownRewardCombinations: [],
    generatedRewards: [],

    lastFocusSessionCompleted: false,
    momentumScore: CEWMA_ALPHA,
    fatigueScore: 0,
    lastFocusSessionDuration: 0,
    feedbackMultiplier: 1.0,
  };

  const nextFocusSessionDuration = calculateFocusSessionDuration(
    base.totalTimer,
    base.totalRemaining,
    base.momentumScore,
    base.fatigueScore
  );
  base.currentTimer = nextFocusSessionDuration;
  base.currentTimerRemaining = nextFocusSessionDuration;

  return base;
};

export const createInitialQuizState = (): QuizReduxState => ({
  currentQuestionId: 'Q1',
  selectedChoices: [],
  isComplete: false,
  results: null,
});
