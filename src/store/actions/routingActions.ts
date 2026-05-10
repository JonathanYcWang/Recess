import { createAction } from '@reduxjs/toolkit';

export const setHasOnboarded = createAction<boolean>('routing/setHasOnboarded');
export const completeOnboarding = createAction('routing/completeOnboarding');
