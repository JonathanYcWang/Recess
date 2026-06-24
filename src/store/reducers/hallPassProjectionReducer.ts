import { createReducer } from '@reduxjs/toolkit';
import type { HallPassSnapshot } from '@/modules/hall-pass';
import {
  setHallPassConnectionState,
  setHallPassProjection,
} from '../actions/hallPassProjectionActions';

export type HallPassConnectionState = 'connecting' | 'connected' | 'disconnected';

export interface HallPassProjectionState {
  revision: number | null;
  snapshot: HallPassSnapshot;
  hallPassEntry: string | null;
  connectionState: HallPassConnectionState;
}

const emptySnapshot = (): HallPassSnapshot => ({
  pendingRequest: null,
  activePass: null,
  rateCoinsPerMinute: 1,
  coinBalance: 0,
});

const initialState: HallPassProjectionState = {
  revision: null,
  snapshot: emptySnapshot(),
  hallPassEntry: null,
  connectionState: 'connecting',
};

const hallPassProjectionReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(setHallPassProjection, (state, action) => {
      state.revision = action.payload.revision;
      state.snapshot = action.payload.snapshot;
      state.hallPassEntry = action.payload.hallPassEntry;
      state.connectionState = 'connected';
    })
    .addCase(setHallPassConnectionState, (state, action) => {
      state.connectionState = action.payload;
    });
});

export default hallPassProjectionReducer;
