import { createReducer } from '@reduxjs/toolkit';
import type { BlockedSitesState } from '../actions/blockedSitesActions';
import {
  addBlockedSite,
  endWorkingSession,
  markBlockedSitesLoaded,
  removeBlockedSite,
  setBlockedSites,
  startWorkingSession,
} from '../actions/blockedSitesActions';

const DEFAULT_SITES = new Set<string>([
  'youtube.com',
  'instagram.com',
  'facebook.com',
  'messenger.com',
  'web.whatsapp.com',
  'discord.com',
  'tiktok.com',
  'netflix.com',
  'primevideo.com',
  'amazon.com',
  'reddit.com',
]);

const initialState: BlockedSitesState = {
  sites: DEFAULT_SITES,
  isLoaded: false,
  isInWorkingSession: false,
};

const blockedSitesReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(setBlockedSites, (state, action) => {
      state.sites = action.payload.sites;
      state.isLoaded = true;
      state.isInWorkingSession = false;
    })
    .addCase(addBlockedSite, (state, action) => {
      if (!state.sites.has(action.payload)) {
        state.sites.add(action.payload);
      }
    })
    .addCase(removeBlockedSite, (state, action) => {
      state.sites.delete(action.payload);
    })
    .addCase(markBlockedSitesLoaded, (state) => {
      state.isLoaded = true;
    })
    .addCase(startWorkingSession, (state) => {
      state.isInWorkingSession = true;
    })
    .addCase(endWorkingSession, (state) => {
      state.isInWorkingSession = false;
    });
});

export default blockedSitesReducer;
