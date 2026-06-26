import type { BlockedSitesState } from './actions/blockedSitesActions';
import type { QuizReduxState } from './actions/quizActions';

export interface RoutingState {
  hasOnboarded: boolean;
}

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

export const createInitialRoutingState = (): RoutingState => ({
  hasOnboarded: false,
});

export const createInitialQuizState = (): QuizReduxState => ({
  currentQuestionId: 'Q1',
  selectedChoices: [],
  isComplete: false,
  results: null,
});
