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
    setHasOnboarded: (state, action: PayloadAction<boolean>) => {
      state.hasOnboarded = action.payload;
    },

    completeOnboarding: (state) => {
      state.hasOnboarded = true;
    },
  },
});

export const { setHasOnboarded, completeOnboarding } = routingSlice.actions;

export default routingSlice.reducer;
