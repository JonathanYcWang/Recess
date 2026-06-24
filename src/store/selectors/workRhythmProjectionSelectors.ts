import type { RootState } from '../index';

export const selectWorkRhythmProjection = (state: RootState) => state.workRhythmProjection;

export const selectWorkRhythmPhase = (state: RootState) =>
  state.workRhythmProjection.snapshot.phase;

export const selectWorkRhythmConnectionState = (state: RootState) =>
  state.workRhythmProjection.connectionState;
