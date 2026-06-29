import type { RootState } from '../../../Redux/store';

export const selectBlockedSites = (state: RootState): string[] => {
  return state.appState?.blockList?.entries ?? [];
};
