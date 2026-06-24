import type { AccessContext } from '@/modules/block-list';
import { mapLegacyTimerToAccessContext } from '@/runtime/background/accessContextMapper';
import { ACCESS_CONTEXT_STORAGE_KEY } from '@/runtime/accessContextStorage';
import type { RootState } from './index';

export const projectAccessContextFromState = (state: RootState): AccessContext => {
  const timer = state.timer;
  const blockListEntries =
    state.blockListProjection?.revision != null
      ? state.blockListProjection.entries
      : state.blockedSites;

  return mapLegacyTimerToAccessContext(
    {
      sessionState: timer.sessionState,
      selectedReward: timer.selectedReward ? { name: timer.selectedReward.name } : null,
      hallPass: null,
    },
    blockListEntries
  );
};

export const publishAccessContext = async (context: AccessContext): Promise<void> => {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    return;
  }
  await chrome.storage.local.set({ [ACCESS_CONTEXT_STORAGE_KEY]: context });
};
