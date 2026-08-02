import { SCHEDULER_PHASE } from '@/Shared/Constants/Constants';
import type { BlockListEntry, PersistedAppState, Reward, SchedulerPhase } from '@/Shared/Types/AppState';
import { normalizeBlockListEntry } from '@/Shared/Utils/normalizeBlockListEntry';

export const isBlocked = (
  entryUrl: string,
  activePhase: SchedulerPhase | null,
  selectedRecess: Reward | null
): boolean => {
  if (activePhase === null) {
    return false;
  }

  if (activePhase === SCHEDULER_PHASE.FOCUS_BLOCK || activePhase === SCHEDULER_PHASE.REWARD_GAME) {
    return true;
  }

  if (activePhase === SCHEDULER_PHASE.RECESS && selectedRecess && entryUrl === selectedRecess.name) {
    return false;
  }

  return true;
};

export const applyBlockListEnforcement = (state: PersistedAppState): PersistedAppState => {
  const { activePhase } = state.scheduler;
  const selectedRecess = state.recessPicker.selectedRecess;

  return {
    ...state,
    blockList: state.blockList.map((entry) => ({
      ...entry,
      isBlocked: isBlocked(entry.url, activePhase, selectedRecess),
    })),
  };
};

export const findBlockListEntry = (
  blockList: BlockListEntry[],
  hostnameOrUrl: string
): BlockListEntry | undefined => {
  const normalizedHost = normalizeBlockListEntry(hostnameOrUrl);

  if (!normalizedHost) {
    return undefined;
  }

  return blockList.find(
    (entry) =>
      normalizedHost === entry.url ||
      normalizedHost.endsWith(`.${entry.url}`)
  );
};
