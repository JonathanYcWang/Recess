import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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

interface BlockedSitesState {
  sites: string[];
  isLoaded: boolean;
  closeDistractingSites: boolean;
  isInWorkingSession: boolean;
}

const initialState: BlockedSitesState = {
  sites: DEFAULT_SITES,
  isLoaded: false,
  closeDistractingSites: false,
  isInWorkingSession: false,
};

const blockedSitesSlice = createSlice({
  name: 'blockedSites',
  initialState,
  reducers: {
    setBlockedSites: (state, action: PayloadAction<string[] | BlockedSitesState>) => {
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
    },

    addBlockedSite: (state, action: PayloadAction<string>) => {
      if (!state.sites.includes(action.payload)) {
        state.sites.push(action.payload);
      }
    },

    removeBlockedSite: (state, action: PayloadAction<string>) => {
      state.sites = state.sites.filter((site) => site !== action.payload);
    },

    markBlockedSitesLoaded: (state) => {
      state.isLoaded = true;
    },

    toggleCloseDistractingSites: (state) => {
      state.closeDistractingSites = !state.closeDistractingSites;
    },

    setCloseDistractingSites: (state, action: PayloadAction<boolean>) => {
      state.closeDistractingSites = action.payload;
    },

    startWorkingSession: (state) => {
      state.isInWorkingSession = true;
      state.closeDistractingSites = true;
    },

    endWorkingSession: (state) => {
      state.isInWorkingSession = false;
      state.closeDistractingSites = false;
    },
  },
});

export const {
  setBlockedSites,
  addBlockedSite,
  removeBlockedSite,
  markBlockedSitesLoaded,
  toggleCloseDistractingSites,
  setCloseDistractingSites,
  startWorkingSession,
  endWorkingSession,
} = blockedSitesSlice.actions;

export default blockedSitesSlice.reducer;
