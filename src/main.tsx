import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './App';
import { getAppState, subscribeToAppState } from './runtime/actionBroker';
import { setAppState } from './store/actions/appStateActions';
import { store } from './store';
import './index.css';

const root = document.getElementById('root');

if (root) {
  getAppState().then((state) => {
    store.dispatch(setAppState(state));
  });

  subscribeToAppState((state) => {
    store.dispatch(setAppState(state));
  });

  createRoot(root).render(
    <StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </StrictMode>,
  );
}
