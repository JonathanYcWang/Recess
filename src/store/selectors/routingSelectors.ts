import type { RootState } from '../index';

// Basic selectors
export const selectRoutingState = (state: RootState) => state.routing;
export const selectHasOnboarded = (state: RootState) => state.routing.hasOnboarded;
