import { createReducer } from '@reduxjs/toolkit';
import { completeOnboarding, setHasOnboarded } from '../actions/routingActions';
import { createInitialRoutingState } from '../initialState';
import type { RoutingState } from '../initialState';

const initialState: RoutingState = createInitialRoutingState();

const routingReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(setHasOnboarded, (state, action) => {
      state.hasOnboarded = action.payload;
    })
    .addCase(completeOnboarding, (state) => {
      state.hasOnboarded = true;
    });
});

export default routingReducer;
