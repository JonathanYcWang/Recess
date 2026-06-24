import type { RootState } from '../index';
import { selectBlockListEntries } from './blockListProjectionSelectors';

export const selectBlockedSites = (state: RootState): string[] => {
  if (state.blockListProjection?.revision != null) {
    return selectBlockListEntries(state);
  }
  return state.blockedSites;
};
