import { DEFAULT_BLOCK_LIST_ENTRIES, SCHEDULER_PHASE } from '@/Shared/Constants/Constants';
import type {
  BlockListEntry,
  PersistedAppState,
  Reward,
  SchedulerPhase,
} from '@/Shared/Types/AppState';
import { getAllTabs, removeTabById } from '@/Background/Adapters/TabAdapter';

export const createDefaultBlockList = (): BlockListEntry[] =>
  DEFAULT_BLOCK_LIST_ENTRIES.map((url) => ({ url, isBlocked: false }));

/** Normalizes user input or a tab URL to a block-list hostname, or undefined if not enforceable. */
export const normalizeBlockListEntry = (input: string): string | undefined => {
  const trimmed = input.trim().toLowerCase();

  if (!trimmed) {
    return undefined;
  }

  const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);
    const host = url.hostname.replace(/\.$/, '');
    return host.includes('.') ? host : undefined;
  } catch {
    return undefined;
  }
};

export const addBlockListEntry = (blockList: BlockListEntry[], input: string): BlockListEntry[] => {
  const url = normalizeBlockListEntry(input);

  if (!url || blockList.some((entry) => entry.url === url)) {
    return blockList;
  }

  return [...blockList, { url, isBlocked: false }].sort((left, right) =>
    left.url.localeCompare(right.url)
  );
};

export const removeBlockListEntry = (
  blockList: BlockListEntry[],
  input: string
): BlockListEntry[] => {
  const url = normalizeBlockListEntry(input);

  if (!url) {
    return blockList;
  }

  return blockList.filter((entry) => entry.url !== url);
};

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

  if (
    activePhase === SCHEDULER_PHASE.RECESS &&
    selectedRecess &&
    entryUrl === selectedRecess.name
  ) {
    return false;
  }

  return true;
};

export const syncBlockListEnforcementFlags = (state: PersistedAppState): PersistedAppState => {
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

export const applyBlockListEnforcement = async (
  state: PersistedAppState
): Promise<PersistedAppState> => {
  const nextState = syncBlockListEnforcementFlags(state);

  if (nextState.scheduler.activePhase === null) {
    return nextState;
  }

  const tabs = await getAllTabs();

  for (const tab of tabs) {
    if (!tab.url || tab.id === undefined) {
      continue;
    }

    if (findBlockListEntry(nextState.blockList, tab.url)?.isBlocked) {
      await removeTabById(tab.id);
    }
  }

  return nextState;
};

export const findBlockListEntry = (
  blockList: BlockListEntry[],
  url: string
): BlockListEntry | undefined => {
  const normalizedHost = normalizeBlockListEntry(url);

  if (!normalizedHost) {
    return undefined;
  }

  return blockList.find(
    (entry) => normalizedHost === entry.url || normalizedHost.endsWith(`.${entry.url}`)
  );
};
