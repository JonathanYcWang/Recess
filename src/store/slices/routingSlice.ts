import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface RoutingState {
  hasOnboarded: boolean;
}

const initialState: RoutingState = {
  hasOnboarded: false,
};

const routingSlice = createSlice({
  name: 'routing',
  initialState,
  reducers: {
    // Set onboarding status
    setHasOnboarded: (state, action: PayloadAction<boolean>) => {
      state.hasOnboarded = action.payload;
    },

    // Complete onboarding
    completeOnboarding: (state) => {
      state.hasOnboarded = true;
    },
  },
});

export const { setHasOnboarded, completeOnboarding } = routingSlice.actions;

export default routingSlice.reducer;
