import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../index';

// Base selector
const selectBlockedSitesState = (state: RootState) => state.blockedSites;

// Memoized selectors
export const selectBlockedSites = createSelector(
  [selectBlockedSitesState],
  (blockedSites) => blockedSites.sites
);


export const selectIsInWorkingSession = createSelector(
  [selectBlockedSitesState],
  (blockedSites) => blockedSites.isInWorkingSession
);

