import { createAction } from '@reduxjs/toolkit';

export interface BlockedSitesState {
  sites: Set<string>;
  isLoaded: boolean;
  isInWorkingSession: boolean;
}

export const setBlockedSites = createAction<BlockedSitesState>('blockedSites/setBlockedSites');
export const addBlockedSite = createAction<string>('blockedSites/addBlockedSite');
export const removeBlockedSite = createAction<string>('blockedSites/removeBlockedSite');
export const markBlockedSitesLoaded = createAction('blockedSites/markBlockedSitesLoaded');
export const startWorkingSession = createAction('blockedSites/startWorkingSession');
export const endWorkingSession = createAction('blockedSites/endWorkingSession');
