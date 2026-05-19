import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../index';

// Base selector
const selectRoutingState = (state: RootState) => state.routing;

// Memoized selectors
export const selectHasOnboarded = createSelector(
  [selectRoutingState],
  (routing) => routing.hasOnboarded
);
