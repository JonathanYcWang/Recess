import { createAction } from '@reduxjs/toolkit';

export type BlockedSitesState = string[];

export const setBlockedSites = createAction<BlockedSitesState>('blockedSites/setBlockedSites');
export const addBlockedSite = createAction<string>('blockedSites/addBlockedSite');
export const removeBlockedSite = createAction<string>('blockedSites/removeBlockedSite');
