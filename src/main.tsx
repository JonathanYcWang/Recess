import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './App';
import './index.css';
import { store } from './store';
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
import { createAppTaskListClient } from './store/taskListClient';
import { startTaskListProjectionSubscription } from './store/taskListProjectionSubscription';
import { startAccessContextPublisher } from './store/accessContextSubscription';

// Initialize store from storage

const settingsClient = createAppSettingsClient();
if (settingsClient) {
  startSettingsProjectionSubscription({ client: settingsClient, dispatch: store.dispatch });
}

const blockListClient = createAppBlockListClient();
if (blockListClient) {
  startBlockListProjectionSubscription({ client: blockListClient, dispatch: store.dispatch });
}

const workRhythmClient = createAppWorkRhythmClient();
if (workRhythmClient) {
  startWorkRhythmProjectionSubscription({ client: workRhythmClient, dispatch: store.dispatch });
}

const hallPassClient = createAppHallPassClient();
if (hallPassClient) {
  startHallPassProjectionSubscription({ client: hallPassClient, dispatch: store.dispatch });
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
  startTaskListProjectionSubscription({ client: taskListClient, dispatch: store.dispatch });
}

startAccessContextPublisher({
  getState: store.getState,
  subscribe: store.subscribe,
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
