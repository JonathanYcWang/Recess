import { createReducer } from '@reduxjs/toolkit';
import type { BlockedSitesState } from '../actions/blockedSitesActions';
import { addBlockedSite, removeBlockedSite, setBlockedSites } from '../actions/blockedSitesActions';
import { createInitialBlockedSitesState } from '../initialState';
export { DEFAULT_BLOCKED_SITES, createInitialBlockedSitesState } from '../initialState';

const initialState: BlockedSitesState = createInitialBlockedSitesState();

const blockedSitesReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(setBlockedSites, (_state, action) => action.payload)
    .addCase(addBlockedSite, (state, action) => {
      if (!state.includes(action.payload)) {
        state.push(action.payload);
      }
    })
    .addCase(removeBlockedSite, (state, action) => state.filter((site) => site !== action.payload));
});

export default blockedSitesReducer;
