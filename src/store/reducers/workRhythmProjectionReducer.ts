import { createReducer } from '@reduxjs/toolkit';
import type { WorkRhythmSnapshot } from '@/modules/work-rhythm';
import {
  setWorkRhythmConnectionState,
  setWorkRhythmProjection,
} from '../actions/workRhythmProjectionActions';

export type WorkRhythmConnectionState = 'connecting' | 'connected' | 'disconnected';

export interface WorkRhythmProjectionState {
  revision: number | null;
  snapshot: WorkRhythmSnapshot;
  connectionState: WorkRhythmConnectionState;
}

const initialState: WorkRhythmProjectionState = {
  revision: null,
  snapshot: { phase: 'inactive' },
  connectionState: 'connecting',
};

const workRhythmProjectionReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(setWorkRhythmProjection, (state, action) => {
      state.revision = action.payload.revision;
      const snapshot = action.payload.snapshot;
      if (snapshot.phase === 'inactive') {
        state.snapshot = { phase: 'inactive' };
      } else if (snapshot.phase === 'recess-prompt' || snapshot.phase === 'time-out') {
        state.snapshot = { ...snapshot };
      } else {
        state.snapshot = {
          ...snapshot,
          schedulerReasonCodes: [...snapshot.schedulerReasonCodes],
        };
      }
      state.connectionState = 'connected';
    })
    .addCase(setWorkRhythmConnectionState, (state, action) => {
      state.connectionState = action.payload;
    });
});

export default workRhythmProjectionReducer;
