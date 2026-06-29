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

export type AppCommand =
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
  | { type: 'APP_COMMAND'; command: AppCommand }
  | { type: 'APP_STATE_CHANGED'; state: PersistedAppState };

export type AppCommandResponse = { ok: true } | { ok: false; error: 'invalid-command' };

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

export const applyAppCommand = (
  state: PersistedAppState,
  command: AppCommand,
  now: Date
): PersistedAppState => {
  if (command.type === 'ADD_BLOCKED_SITE') {
    return {
      ...state,
      blockList: addBlockListEntry(state.blockList, command.hostname),
    };
  }

  if (command.type === 'REMOVE_BLOCKED_SITE') {
    return {
      ...state,
      blockList: removeBlockListEntry(state.blockList, command.hostname),
    };
  }

  if (command.type === 'START_FOCUS') {
    return { ...state, scheduler: startFocus(now) };
  }

  if (command.type === 'PAUSE_SCHEDULER') {
    return { ...state, scheduler: pauseScheduler(state.scheduler, now) };
  }

  if (command.type === 'RESUME_SCHEDULER') {
    return { ...state, scheduler: resumeScheduler(state.scheduler, now) };
  }

  if (command.type === 'SET_WORK_START_REMINDER') {
    return {
      ...state,
      workStartReminder: setWorkStartReminder(new Date(command.startsAt)),
    };
  }

  if (command.type === 'CLEAR_WORK_START_REMINDER') {
    return { ...state, workStartReminder: clearWorkStartReminder() };
  }

  return {
    ...state,
    coin: setCoinBalance(state.coin, command.balance),
  };
};
