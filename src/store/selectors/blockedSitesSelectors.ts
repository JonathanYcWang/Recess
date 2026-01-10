import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../index';

// Base selector
export const selectBlockedSitesState = (state: RootState) => state.blockedSites;

// Memoized selectors
export const selectBlockedSites = createSelector(
  [selectBlockedSitesState],
  (blockedSites) => blockedSites.sites
);

export const selectIsBlockedSitesLoaded = createSelector(
  [selectBlockedSitesState],
  (blockedSites) => blockedSites.isLoaded
);

export const selectCloseDistractingSites = createSelector(
  [selectBlockedSitesState],
  (blockedSites) => blockedSites.closeDistractingSites
);

export const selectIsInWorkingSession = createSelector(
  [selectBlockedSitesState],
  (blockedSites) => blockedSites.isInWorkingSession
);

export const selectShouldBlockSites = createSelector(
  [selectIsInWorkingSession, selectBlockedSites],
  (isInSession, sites) => isInSession && sites.length > 0
);
