import {
  addBlockListEntry,
  createDefaultBlockListValue,
  removeBlockListEntry,
} from '@/Background/Services/BlockListManagement/BlockListManagementService';
import {
  createDefaultCoinBalanceValue,
  setCoinBalance,
} from '@/Background/Services/Coin/CoinService';
import { generateReward, generateRewardSet } from '@/Background/Services/Reward/RewardService';
import {
  createDefaultSchedulerState,
  endWorkSession,
  evaluateScheduler,
  startFocusBlock,
  startRecess,
  startWorkSession,
} from '@/Background/Services/Scheduler/SchedulerService';
import {
  clearWorkStartReminder,
  createDefaultWorkStartReminderValue,
  setWorkStartReminder,
} from '@/Background/Services/WorkStartReminder/WorkStartReminderService';
import { broadcastAppState } from '@/Background/Broadcasters/appStateBroadcaster';
import { storageRepository } from '@/Background/Repositories/StorageRepository';
import { APP_ACTION, DEFAULT_REROLLS, SCHEDULER_PHASE } from '@/Shared/Constants/Constants';
import type {
  AppAction,
  AppActionResponse,
  PersistedAppState,
  QuizValue,
} from '@/Shared/Types/AppState';
import type { QuizOption } from '@/Shared/Types/Quiz';

export const APP_STATE_STORAGE_KEY = 'appState';

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
  rewardsState: {
    rerolls: DEFAULT_REROLLS,
    selectedReward: null,
    rewards: [],
  },
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const isPersistedAppState = (value: unknown): value is PersistedAppState =>
  isRecord(value) &&
  isRecord(value.blockList) &&
  Array.isArray(value.blockList.entries) &&
  typeof value.coin === 'number' &&
  isRecord(value.scheduler) &&
  (typeof value.scheduler.activePhase === 'string' || value.scheduler.activePhase === null) &&
  typeof value.scheduler.workSessionRemaining === 'number' &&
  isRecord(value.workStartReminder) &&
  (typeof value.workStartReminder.startsAt === 'string' ||
    value.workStartReminder.startsAt === null);

const selectQuizOption = (quiz: QuizValue, option: QuizOption): QuizValue => {
  const selectedChoices = [...quiz.selectedChoices, option.id];
  return {
    ...quiz,
    selectedChoices,
    currentQuestionId: option.next,
    isComplete: option.next === 'COMPLETE',
  };
};

const getStoredAppState = async (): Promise<PersistedAppState> => {
  const value = await storageRepository.read<PersistedAppState>(APP_STATE_STORAGE_KEY);
  return isPersistedAppState(value) ? value : createDefaultPersistedAppState();
};

const saveAppState = async (state: PersistedAppState): Promise<void> => {
  await storageRepository.write(APP_STATE_STORAGE_KEY, state);
};

export const handleGetAppState = async (): Promise<PersistedAppState> => {
  const state = await getStoredAppState();

  await saveAppState(state);

  return state;
};

export const handleAppAction = async (action: AppAction): Promise<AppActionResponse> => {
  const currentState = await getStoredAppState();
  const nextState = applyAppAction(currentState, action, new Date());

  await saveAppState(nextState);
  await broadcastAppState(nextState);

  return { ok: true };
};

export const applyAppAction = (
  state: PersistedAppState,
  action: AppAction,
  now: Date
): PersistedAppState => {
  if (action.type === APP_ACTION.SCHEDULER_EVALUATE) {
    const nextScheduler = evaluateScheduler(state.scheduler, now);
    if (nextScheduler.activePhase === SCHEDULER_PHASE.REWARD_GAME && state.blockList.entries.length > 0) {
      return {
        ...state,
        scheduler: nextScheduler,
        rewardsState: {
          ...state.rewardsState,
          rewards: generateRewardSet(state.blockList),
          selectedReward: null,
          rerolls: DEFAULT_REROLLS,
        },
      };
    }
    return { ...state, scheduler: nextScheduler };
  }

  if (action.type === APP_ACTION.START_FOCUS) {
    return { ...state, scheduler: startFocusBlock(state.scheduler, now) };
  }

  if (action.type === APP_ACTION.START_WORK_SESSION) {
    return { ...state, scheduler: startWorkSession(now) };
  }

  if (action.type === APP_ACTION.REWARDS_SELECT_REWARD) {
    return {
      ...state,
      scheduler: startRecess(state.scheduler, now),
      rewardsState: { ...state.rewardsState, selectedReward: action.reward },
    };
  }

  if (action.type === APP_ACTION.REWARDS_REROLL_REWARD) {
    if (state.rewardsState.rerolls <= 0 || state.blockList.entries.length === 0) return state;
    const rewards = [...state.rewardsState.rewards];
    rewards[action.index] = generateReward(state.blockList);
    return {
      ...state,
      rewardsState: { ...state.rewardsState, rewards, rerolls: state.rewardsState.rerolls - 1 },
    };
  }

  if (action.type === APP_ACTION.END_WORK_SESSION_EARLY) {
    return { ...state, scheduler: endWorkSession(state.scheduler) };
  }

  if (action.type === APP_ACTION.ADD_BLOCKED_SITE) {
    return {
      ...state,
      blockList: addBlockListEntry(state.blockList, action.hostname),
    };
  }

  if (action.type === APP_ACTION.REMOVE_BLOCKED_SITE) {
    return {
      ...state,
      blockList: removeBlockListEntry(state.blockList, action.hostname),
    };
  }

  if (action.type === APP_ACTION.SET_WORK_START_REMINDER) {
    return {
      ...state,
      workStartReminder: setWorkStartReminder(new Date(action.startsAt)),
    };
  }

  if (action.type === APP_ACTION.CLEAR_WORK_START_REMINDER) {
    return { ...state, workStartReminder: clearWorkStartReminder() };
  }

  if (action.type === APP_ACTION.SET_COIN_BALANCE) {
    return {
      ...state,
      coin: setCoinBalance(state.coin, action.balance),
    };
  }

  if (action.type === APP_ACTION.INITIALIZE_FROM_ONBOARDING) {
    return {
      ...state,
      workstyleProfile: {
        ...state.workstyleProfile,
        onboardingCompleted: true,
      },
    };
  }

  if (action.type === APP_ACTION.QUIZ_SELECT_OPTION) {
    return { ...state, quiz: selectQuizOption(state.quiz, action.option) };
  }

  if (action.type === APP_ACTION.QUIZ_RESTART) {
    return {
      ...state,
      quiz: { currentQuestionId: 'Q1', selectedChoices: [], isComplete: false, results: null },
    };
  }

  return state;
};
