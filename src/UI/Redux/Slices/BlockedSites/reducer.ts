import { createReducer } from '@reduxjs/toolkit';
import type { BlockedSitesState } from './actions';
import { addBlockedSite, removeBlockedSite, setBlockedSites } from './actions';
import { createInitialBlockedSitesState } from '../../initialState';

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
