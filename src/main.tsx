import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './App';
import './index.css';
import { store } from './store';
import { loadStateFromStorage, seedInitialStateInStorage } from './store/storageMiddleware';
import { setBlockedSites } from './store/actions/blockedSitesActions';
import { setHasOnboarded } from './store/actions/routingActions';
import { updateTimerState } from './store/actions/timerActions';
import { setQuizState } from './store/actions/quizActions';
import { createAppSettingsClient } from './store/settingsClient';
import { startSettingsProjectionSubscription } from './store/settingsProjectionSubscription';
import { createAppBlockListClient } from './store/blockListClient';
import { startBlockListProjectionSubscription } from './store/blockListProjectionSubscription';
import { startWorkRhythmProjectionSubscription } from './store/workRhythmProjectionSubscription';
import { createAppWorkRhythmClient } from './store/workRhythmClient';
import { createAppHallPassClient } from './store/hallPassClient';
import { startHallPassProjectionSubscription } from './store/hallPassProjectionSubscription';
import { createAppWorkStartReminderClient } from './store/workStartReminderClient';
import { startWorkStartReminderProjectionSubscription } from './store/workStartReminderProjectionSubscription';
import { startAccessContextPublisher } from './store/accessContextSubscription';

// Initialize store from storage
seedInitialStateInStorage()
  .then(() => loadStateFromStorage())
  .then((savedState) => {
    if (savedState.timer) {
      store.dispatch(updateTimerState(savedState.timer));
    }
    if (savedState.blockedSites) {
      store.dispatch(setBlockedSites(savedState.blockedSites));
    }
    if (savedState.routing !== undefined) {
      store.dispatch(setHasOnboarded(savedState.routing));
    }

    if (savedState.quiz) {
      store.dispatch(setQuizState(savedState.quiz));
    }

    const settingsClient = createAppSettingsClient();
    if (settingsClient) {
      startSettingsProjectionSubscription({
        client: settingsClient,
        dispatch: store.dispatch,
      });
    }

    const blockListClient = createAppBlockListClient();
    if (blockListClient) {
      startBlockListProjectionSubscription({
        client: blockListClient,
        dispatch: store.dispatch,
      });
    }

    const workRhythmClient = createAppWorkRhythmClient();
    if (workRhythmClient) {
      startWorkRhythmProjectionSubscription({
        client: workRhythmClient,
        dispatch: store.dispatch,
      });
    }

    const hallPassClient = createAppHallPassClient();
    if (hallPassClient) {
      startHallPassProjectionSubscription({
        client: hallPassClient,
        dispatch: store.dispatch,
      });
    }

    const workStartReminderClient = createAppWorkStartReminderClient();
    if (workStartReminderClient) {
      startWorkStartReminderProjectionSubscription({
        client: workStartReminderClient,
        dispatch: store.dispatch,
      });
    }

    startAccessContextPublisher({
      getState: () => store.getState(),
      subscribe: (listener) => store.subscribe(listener),
    });
  });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
