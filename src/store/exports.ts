// Redux Store Exports
export { store } from './index';
export type { RootState, AppDispatch } from './index';

// Redux Hooks
export { useAppDispatch, useAppSelector } from './hooks';

// Feature Hooks
export { useTimer } from './hooks/useTimer';
export { useWorkHoursRedux } from './hooks/useWorkHours';
export { useBlockedSitesRedux } from './hooks/useBlockedSites';
export { useRoutePersistenceRedux } from './hooks/useRoutePersistence';

// Selectors
export * from './selectors';

// Actions - Timer
export {
  startFocusSession,
  pauseSession,
  resumeSession,
  endSessionEarly,
  selectReward,
  setGeneratedRewards,
  rerollReward,
  resetTimer,
  updateTimerState,
  decrementBackToIt,
  transitionToFocusSession,
  transitionToRewardSelection,
  transitionToBackToIt,
} from './slices/timerSlice';

// Actions - Work Hours
export {
  setWorkHours,
  addWorkHoursEntry,
  updateWorkHoursEntry,
  deleteWorkHoursEntry,
  toggleWorkHoursEntry,
  markWorkHoursLoaded,
} from './slices/workHoursSlice';

// Actions - Blocked Sites
export {
  setBlockedSites,
  addBlockedSite,
  removeBlockedSite,
  markBlockedSitesLoaded,
} from './slices/blockedSitesSlice';

// Actions - Routing
export { setHasOnboarded, completeOnboarding } from './slices/routingSlice';
