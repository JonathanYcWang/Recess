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
}

const initialState: BlockedSitesState = {
  sites: DEFAULT_SITES,
  isLoaded: false,
};

const blockedSitesSlice = createSlice({
  name: 'blockedSites',
  initialState,
  reducers: {
    // Set all blocked sites (used when loading from storage)
    setBlockedSites: (state, action: PayloadAction<string[]>) => {
      state.sites = action.payload;
      state.isLoaded = true;
    },

    // Add a new blocked site
    addBlockedSite: (state, action: PayloadAction<string>) => {
      if (!state.sites.includes(action.payload)) {
        state.sites.push(action.payload);
      }
    },

    // Remove a blocked site
    removeBlockedSite: (state, action: PayloadAction<string>) => {
      state.sites = state.sites.filter((site) => site !== action.payload);
    },

    // Mark as loaded
    markBlockedSitesLoaded: (state) => {
      state.isLoaded = true;
    },
  },
});

export const { setBlockedSites, addBlockedSite, removeBlockedSite, markBlockedSitesLoaded } =
  blockedSitesSlice.actions;

export default blockedSitesSlice.reducer;
