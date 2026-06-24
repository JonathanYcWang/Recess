import type { RootState } from '../index';

export const selectHallPassProjection = (state: RootState) => state.hallPassProjection;

export const selectHallPassConnectionState = (state: RootState) =>
  state.hallPassProjection.connectionState;

export const selectHallPassEntry = (state: RootState) => state.hallPassProjection.hallPassEntry;
