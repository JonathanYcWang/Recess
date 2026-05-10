import { createReducer } from '@reduxjs/toolkit';
import type { BlockedSitesState } from '../actions/blockedSitesActions';
import {
  addBlockedSite,
  endWorkingSession,
  markBlockedSitesLoaded,
  removeBlockedSite,
  setBlockedSites,
  setCloseDistractingSites,
  startWorkingSession,
  toggleCloseDistractingSites,
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
  closeDistractingSites: false,
  isInWorkingSession: false,
};

const blockedSitesReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(setBlockedSites, (state, action) => {
      // Handle both legacy format (just sites array) and new format (full state object)
      if (Array.isArray(action.payload)) {
        state.sites = action.payload;
        state.isLoaded = true;
      } else {
        state.sites = action.payload.sites || state.sites;
        state.isLoaded = action.payload.isLoaded !== undefined ? action.payload.isLoaded : true;
        state.closeDistractingSites = action.payload.closeDistractingSites || false;
        state.isInWorkingSession = action.payload.isInWorkingSession || false;
      }
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
    .addCase(toggleCloseDistractingSites, (state) => {
      state.closeDistractingSites = !state.closeDistractingSites;
    })
    .addCase(setCloseDistractingSites, (state, action) => {
      state.closeDistractingSites = action.payload;
    })
    .addCase(startWorkingSession, (state) => {
      state.isInWorkingSession = true;
      state.closeDistractingSites = true;
    })
    .addCase(endWorkingSession, (state) => {
      state.isInWorkingSession = false;
      state.closeDistractingSites = false;
    });
});

export default blockedSitesReducer;
