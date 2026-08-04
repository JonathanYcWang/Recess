import {
  addBlockListEntry,
  removeBlockListEntry,
} from '@/Background/Services/BlockListManagement/BlockListManagementService';
import { generateReward } from '@/Background/Services/Reward/RewardService';
import {
  evaluateScheduler,
  startRecess,
  startWorkSession,
} from '@/Background/Services/Scheduler/SchedulerService';
import { broadcastAppState } from '@/Background/Broadcasters/appStateBroadcaster';
import { storageRepository } from '@/Background/Repositories/StorageRepository';
import { APP_ACTION } from '@/Shared/Constants/Constants';
import {
  applyBlockListEnforcement,
  syncBlockListEnforcementFlags,
} from '@/Shared/Utils/blockListEnforcement';
import type { AppAction, AppActionResponse, PersistedAppState } from '@/Shared/Types/AppState';
import {
  enterRecessPicker,
  exitRecess,
  isEnteringRecessPicker,
  isExitingRecess,
} from '@/Background/ActionHandlers/ActionHandlerHelpers';
import { createDefaultPersistedAppState } from '@/Shared/State/defaults';
import type { SchedulerState } from '@/Shared/Types/AppState';

export const handleGetAppState = async (): Promise<PersistedAppState> => {
  const state = syncBlockListEnforcementFlags(await storageRepository.readAppState());
  await storageRepository.writeAppState(state);

  return state;
};

export const handleAppAction = async (action: AppAction): Promise<AppActionResponse> => {
  const currentState = await storageRepository.readAppState();
  const nextState = applyAppAction(currentState, action, new Date());
  const enforcedState = await applyBlockListEnforcement(nextState);

  await storageRepository.writeAppState(enforcedState);
  await broadcastAppState(enforcedState);

  return { ok: true };
};

const isWorkSessionEnded = (before: PersistedAppState, nextScheduler: SchedulerState): boolean =>
  before.scheduler.activePhase !== null && nextScheduler.activePhase === null;

const applyAppAction = (
  state: PersistedAppState,
  action: AppAction,
  now: Date
): PersistedAppState => {
  if (action.type === APP_ACTION.SCHEDULER_EVALUATE) {
    const nextScheduler = evaluateScheduler(state.scheduler, now);
    if (isEnteringRecessPicker(state, nextScheduler)) {
      return enterRecessPicker(state, nextScheduler);
    }

    if (isExitingRecess(state, nextScheduler)) {
      return exitRecess(state, nextScheduler);
    }

    if (isWorkSessionEnded(state, nextScheduler)) {
      return createDefaultPersistedAppState();
    }

    return { ...state, scheduler: nextScheduler };
  }

  if (action.type === APP_ACTION.START_WORK_SESSION) {
    return {
      ...createDefaultPersistedAppState(),
      blockList: state.blockList,
      scheduler: startWorkSession(now),
    };
  }

  if (action.type === APP_ACTION.RECESS_PICKER_SELECT_RECESS) {
    return {
      ...state,
      scheduler: startRecess(state.scheduler, now),
      recessPicker: { ...state.recessPicker, selectedRecess: action.recess },
    };
  }

  if (action.type === APP_ACTION.RECESS_PICKER_REROLL) {
    if (state.recessPicker.rerolls <= 0 || state.blockList.length === 0) return state;
    const recessOptions = [...state.recessPicker.recessOptions];
    recessOptions[action.index] = generateReward(state.blockList);
    return {
      ...state,
      recessPicker: {
        ...state.recessPicker,
        recessOptions,
        rerolls: state.recessPicker.rerolls - 1,
      },
    };
  }

  if (action.type === APP_ACTION.END_WORK_SESSION_EARLY) {
    return createDefaultPersistedAppState();
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

  // Actions below are defined for future UI/services; they do not mutate PersistedAppState yet.
  if (action.type === APP_ACTION.SET_WORK_START_REMINDER) {
    return state;
  }

  if (action.type === APP_ACTION.CLEAR_WORK_START_REMINDER) {
    return state;
  }

  if (action.type === APP_ACTION.SET_COIN_BALANCE) {
    return state;
  }

  if (action.type === APP_ACTION.INITIALIZE_FROM_ONBOARDING) {
    return state;
  }

  if (action.type === APP_ACTION.RECESS_PICKER_SET_SHOWN_COMBINATIONS) {
    return state;
  }

  if (action.type === APP_ACTION.QUIZ_SELECT_OPTION) {
    return state;
  }

  if (action.type === APP_ACTION.QUIZ_RESTART) {
    return state;
  }

  return state;
};
