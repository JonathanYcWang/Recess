import { createReducer } from '@reduxjs/toolkit';
import {
  setBlockListConnectionState,
  setBlockListProjection,
} from '../actions/blockListProjectionActions';

export type BlockListConnectionState = 'connecting' | 'connected' | 'disconnected';

export interface BlockListProjectionState {
  revision: number | null;
  entries: string[];
  connectionState: BlockListConnectionState;
}

const initialState: BlockListProjectionState = {
  revision: null,
  entries: [],
  connectionState: 'connecting',
};

const blockListProjectionReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(setBlockListProjection, (state, action) => {
      state.revision = action.payload.revision;
      state.entries = action.payload.entries;
      state.connectionState = 'connected';
    })
    .addCase(setBlockListConnectionState, (state, action) => {
      state.connectionState = action.payload;
    });
});

export default blockListProjectionReducer;
