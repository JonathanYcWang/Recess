import type { BlockListValue } from '@/Background/Services/BlockListManagement/BlockListManagementService';
import type { Reward } from './Reward';
import type { QuizOption, QuizResults } from './Quiz';
import { APP_ACTION, SCHEDULER_PHASE } from '../Constants/Constants';

export type SchedulerPhase = (typeof SCHEDULER_PHASE)[keyof typeof SCHEDULER_PHASE];

// interface SchedulerPhaseTimelineEntry {
//   phase: SchedulerPhase;
//   startedAt: string;
//   endedAt: string | null;
// }

export interface SchedulerState {
  activePhase: SchedulerPhase | null;
  phaseStart: string | null;
  phaseTarget: number;
  workSessionTarget: number;
  workSessionRemaining: number;
  // timeline: SchedulerPhaseTimelineEntry[];
}

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

export interface RecessPickerState {
  rerolls: number;
  selectedRecess: Reward | null;
  recessOptions: Reward[];
}

export interface PersistedAppState {
  blockList: BlockListValue;
  scheduler: SchedulerState;
  recessPicker: RecessPickerState;
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

export type AppActionName = (typeof APP_ACTION)[keyof typeof APP_ACTION];

export type AppAction =
  | { type: typeof APP_ACTION.ADD_BLOCKED_SITE; hostname: string }
  | { type: typeof APP_ACTION.REMOVE_BLOCKED_SITE; hostname: string }
  | { type: typeof APP_ACTION.START_FOCUS }
  | { type: typeof APP_ACTION.START_WORK_SESSION }
  | { type: typeof APP_ACTION.END_WORK_SESSION_EARLY }
  | { type: typeof APP_ACTION.SCHEDULER_EVALUATE }
  | { type: typeof APP_ACTION.SET_WORK_START_REMINDER; startsAt: string }
  | { type: typeof APP_ACTION.CLEAR_WORK_START_REMINDER }
  | { type: typeof APP_ACTION.SET_COIN_BALANCE; balance: number }
  | {
      type: typeof APP_ACTION.INITIALIZE_FROM_ONBOARDING;
      energy: EnergyLevel;
      cadence: PreferredCadence;
      primaryFriction: FrictionDimension;
    }
  | { type: typeof APP_ACTION.RECESS_PICKER_SELECT_RECESS; recess: Reward }
  | { type: typeof APP_ACTION.RECESS_PICKER_REROLL; index: number }
  | { type: typeof APP_ACTION.RECESS_PICKER_SET_SHOWN_COMBINATIONS; combinations: string[] }
  | { type: typeof APP_ACTION.QUIZ_SELECT_OPTION; option: QuizOption }
  | { type: typeof APP_ACTION.QUIZ_RESTART };

export type BackgroundRequest =
  | { type: 'GET_APP_STATE' }
  | { type: 'APP_ACTION'; action: AppAction };

export type BackgroundEvent = { type: 'APP_STATE_CHANGED'; state: PersistedAppState };

export type RuntimeMessage = BackgroundRequest | BackgroundEvent;

export type AppActionResponse = { ok: true } | { ok: false; error: 'invalid-action' };
