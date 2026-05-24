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

const DEFAULT_SITES = [
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
];

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
      if (!state.sites.includes(action.payload)) {
        state.sites.push(action.payload);
      }
    })
    .addCase(removeBlockedSite, (state, action) => {
      state.sites = state.sites.filter((site) => site !== action.payload);
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
