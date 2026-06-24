import { configureStore } from '@reduxjs/toolkit';
import timerReducer from './reducers/timerReducer';
import workHoursReducer from './reducers/workHoursReducer';
import blockedSitesReducer from './reducers/blockedSitesReducer';
import routingReducer from './reducers/routingReducer';
import quizReducer from './reducers/quizReducer';
import settingsProjectionReducer from './reducers/settingsProjectionReducer';
import blockListProjectionReducer from './reducers/blockListProjectionReducer';
import workstyleProfileProjectionReducer from './reducers/workstyleProfileProjectionReducer';
import workRhythmProjectionReducer from './reducers/workRhythmProjectionReducer';
import hallPassProjectionReducer from './reducers/hallPassProjectionReducer';
import workStartReminderProjectionReducer from './reducers/workStartReminderProjectionReducer';
import { storageMiddleware } from './storageMiddleware';

export const store = configureStore({
  reducer: {
    timer: timerReducer,
    workHours: workHoursReducer,
    blockedSites: blockedSitesReducer,
    routing: routingReducer,
    quiz: quizReducer,
    settingsProjection: settingsProjectionReducer,
    blockListProjection: blockListProjectionReducer,
    workstyleProfileProjection: workstyleProfileProjectionReducer,
    workRhythmProjection: workRhythmProjectionReducer,
    hallPassProjection: hallPassProjectionReducer,
    workStartReminderProjection: workStartReminderProjectionReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types that may contain non-serializable data
        ignoredActions: ['timer/updateTimerState'],
      },
    }).concat(storageMiddleware),
  // Enable Redux DevTools explicitly so the extension window/tab is discoverable
  devTools: { name: 'Recess', trace: true },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
