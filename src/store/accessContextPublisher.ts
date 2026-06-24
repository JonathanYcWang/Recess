import type { AccessContext } from '@/modules/block-list';
import { mapLegacyTimerToAccessContext } from '@/runtime/background/accessContextMapper';
import { ACCESS_CONTEXT_STORAGE_KEY } from '@/runtime/accessContextStorage';
import type { RootState } from './index';

export const projectAccessContextFromState = (state: RootState): AccessContext => {
  const blockListEntries =
    state.blockListProjection?.revision != null
      ? state.blockListProjection.entries
      : state.blockedSites;

  if (
    state.workRhythmProjection.connectionState === 'connected' &&
    state.workRhythmProjection.snapshot.phase === 'focus-block'
  ) {
    return {
      phase: 'focus-block',
      blockListEntries,
      recessPassEntry: null,
      hallPassEntry: null,
    };
  }

  if (
    state.workRhythmProjection.connectionState === 'connected' &&
    state.workRhythmProjection.snapshot.phase === 'recess-prompt'
  ) {
    return {
      phase: 'reward-game',
      blockListEntries,
      recessPassEntry: null,
      hallPassEntry: null,
    };
  }

  const timer = state.timer;

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
