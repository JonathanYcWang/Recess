import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../index';

// Basic selectors
export const selectBlockedSitesState = (state: RootState) => state.blockedSites;
export const selectBlockedSites = (state: RootState) => state.blockedSites.sites;
export const selectBlockedSitesIsLoaded = (state: RootState) => state.blockedSites.isLoaded;

// Memoized selectors (computed values)
export const selectBlockedSitesCount = createSelector(
  [selectBlockedSites],
  (sites) => sites.length
);

export const selectIsBlockedSite = createSelector(
  [selectBlockedSites, (_state: RootState, site: string) => site],
  (sites, site) => sites.includes(site)
);
