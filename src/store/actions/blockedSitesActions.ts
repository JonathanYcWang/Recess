import { createAction } from '@reduxjs/toolkit';

export interface BlockedSitesState {
  sites: string[];
  isLoaded: boolean;
  closeDistractingSites: boolean;
  isInWorkingSession: boolean;
}

export const setBlockedSites = createAction<string[] | BlockedSitesState>(
  'blockedSites/setBlockedSites'
);
export const addBlockedSite = createAction<string>('blockedSites/addBlockedSite');
export const removeBlockedSite = createAction<string>('blockedSites/removeBlockedSite');
export const markBlockedSitesLoaded = createAction('blockedSites/markBlockedSitesLoaded');
export const toggleCloseDistractingSites = createAction('blockedSites/toggleCloseDistractingSites');
export const setCloseDistractingSites = createAction<boolean>('blockedSites/setCloseDistractingSites');
export const startWorkingSession = createAction('blockedSites/startWorkingSession');
export const endWorkingSession = createAction('blockedSites/endWorkingSession');
