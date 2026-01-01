import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './App';
import './index.css';
import { store } from './store';
import { loadStateFromStorage } from './store/storageMiddleware';
import { setWorkHours } from './store/slices/workHoursSlice';
import { setBlockedSites } from './store/slices/blockedSitesSlice';
import { setHasOnboarded } from './store/slices/routingSlice';
import { updateTimerState } from './store/slices/timerSlice';

// Initialize store from storage
loadStateFromStorage().then((savedState) => {
  if (savedState.timer) {
    store.dispatch(updateTimerState(savedState.timer));
  }
  if (savedState.workHours) {
    store.dispatch(setWorkHours(savedState.workHours));
  }
  if (savedState.blockedSites) {
    store.dispatch(setBlockedSites(savedState.blockedSites));
  }
  if (savedState.routing !== undefined) {
    store.dispatch(setHasOnboarded(savedState.routing));
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
