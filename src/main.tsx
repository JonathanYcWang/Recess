import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './App';
import './index.css';
import { store } from './UI/Redux';
import { loadStateFromStorage, seedInitialStateInStorage } from './UI/Redux/storageMiddleware';
import { setBlockedSites } from './UI/Redux/actions/blockedSitesActions';
import { setHasOnboarded } from './UI/Redux/actions/routingActions';
import { updateTimerState } from './UI/Redux/actions/timerActions';
import { setQuizState } from './UI/Redux/actions/quizActions';
import { createAppSettingsClient } from './UI/Redux/settingsClient';
import { startSettingsProjectionSubscription } from './UI/Redux/settingsProjectionSubscription';
import { createAppBlockListClient } from './UI/Redux/blockListClient';
import { startBlockListProjectionSubscription } from './UI/Redux/blockListProjectionSubscription';
import { startWorkRhythmProjectionSubscription } from './UI/Redux/workRhythmProjectionSubscription';
import { createAppWorkRhythmClient } from './UI/Redux/workRhythmClient';
import { createAppHallPassClient } from './UI/Redux/hallPassClient';
import { startHallPassProjectionSubscription } from './UI/Redux/hallPassProjectionSubscription';
import { createAppWorkStartReminderClient } from './UI/Redux/workStartReminderClient';
import { startWorkStartReminderProjectionSubscription } from './UI/Redux/workStartReminderProjectionSubscription';
import { createAppTaskListClient } from './UI/Redux/taskListClient';
import { startTaskListProjectionSubscription } from './UI/Redux/taskListProjectionSubscription';
import { startAccessContextPublisher } from './UI/Redux/accessContextSubscription';

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

    const taskListClient = createAppTaskListClient();
    if (taskListClient) {
      startTaskListProjectionSubscription({
        client: taskListClient,
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
