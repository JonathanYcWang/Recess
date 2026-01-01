import { configureStore } from '@reduxjs/toolkit';
import timerReducer from './slices/timerSlice';
import workHoursReducer from './slices/workHoursSlice';
import blockedSitesReducer from './slices/blockedSitesSlice';
import routingReducer from './slices/routingSlice';
import { storageMiddleware } from './storageMiddleware';

export const store = configureStore({
  reducer: {
    timer: timerReducer,
    workHours: workHoursReducer,
    blockedSites: blockedSitesReducer,
    routing: routingReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types that may contain non-serializable data
        ignoredActions: ['timer/updateTimerState'],
      },
    }).concat(storageMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
