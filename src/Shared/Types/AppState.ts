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

export const APP_STATE_STORAGE_KEY = 'appState';

export interface WorkstyleProfileValue {
  onboardingCompleted: boolean;
  activePetId: string | null;
}

export interface QuizValue {
  currentQuestionId: string;
  selectedChoices: string[];
  isComplete: boolean;
  results: unknown;
}

export interface PersistedAppState {
  blockList: BlockListValue;
  coin: number;
  scheduler: SchedulerState;
  workStartReminder: WorkStartReminderValue;
  workstyleProfile: WorkstyleProfileValue;
  quiz: QuizValue;
}

export type AppAction =
  | { type: 'ADD_BLOCKED_SITE'; hostname: string }
  | { type: 'REMOVE_BLOCKED_SITE'; hostname: string }
  | { type: 'START_FOCUS' }
  | { type: 'PAUSE_SCHEDULER' }
  | { type: 'RESUME_SCHEDULER' }
  | { type: 'SET_WORK_START_REMINDER'; startsAt: string }
  | { type: 'CLEAR_WORK_START_REMINDER' }
  | { type: 'SET_COIN_BALANCE'; balance: number };

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
    value.workStartReminder.startsAt === null);

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

  return {
    ...state,
    coin: setCoinBalance(state.coin, action.balance),
  };
};
