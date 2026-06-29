import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './App';
import type { PersistedAppState } from '../Shared/Types/AppState';
import { getAppState, subscribeToAppState } from '../Shared/Adapters/ActionBroker';
import { setAppState } from './Redux/Slices/AppState/actions';
import { store } from './Redux/store';
import './index.css';

const root = document.getElementById('root');

if (root) {
  getAppState().then((state: PersistedAppState) => {
    store.dispatch(setAppState(state));
  });

  subscribeToAppState((state: PersistedAppState) => {
    store.dispatch(setAppState(state));
  });

  createRoot(root).render(
    <StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </StrictMode>
  );
}
