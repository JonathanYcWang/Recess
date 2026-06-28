import type { RootState } from '../index';

export const selectBlockListEntries = (state: RootState): string[] =>
  state.blockListProjection.entries;

export const selectBlockListRevision = (state: RootState): number | null =>
  state.blockListProjection.revision;

export const selectBlockListConnectionState = (state: RootState) =>
  state.blockListProjection.connectionState;

export const selectIsBlockListDisconnected = (state: RootState): boolean =>
  state.blockListProjection.connectionState === 'disconnected';
