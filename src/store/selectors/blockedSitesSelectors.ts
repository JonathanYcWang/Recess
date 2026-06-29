import type { RootState } from '../index';

export const selectBlockedSites = (state: RootState): string[] => {
  return state.appState?.blockList?.entries ?? [];
};
