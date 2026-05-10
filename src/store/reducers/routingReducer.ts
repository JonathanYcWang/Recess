import { createReducer } from '@reduxjs/toolkit';
import { completeOnboarding, setHasOnboarded } from '../actions/routingActions';

interface RoutingState {
  hasOnboarded: boolean;
}

const initialState: RoutingState = {
  hasOnboarded: false,
};

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
