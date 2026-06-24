import type { SettingsClient, SettingsSnapshot } from '@/runtime';
import type { AppDispatch } from './index';
import {
  setSettingsConnectionState,
  setSettingsProjection,
} from './actions/settingsProjectionActions';

let activeClient: SettingsClient | null = null;
let unsubscribeSnapshot: (() => void) | null = null;

const projectSnapshot = (dispatch: AppDispatch, snapshot: SettingsSnapshot): void => {
  dispatch(
    setSettingsProjection({
      revision: snapshot.revision,
      themePreference: snapshot.value.themePreference,
    })
  );
};

export const startSettingsProjectionSubscription = (options: {
  client: SettingsClient;
  dispatch: AppDispatch;
}): (() => void) => {
  if (activeClient) {
    return () => undefined;
  }

  activeClient = options.client;
  unsubscribeSnapshot = options.client.subscribe((snapshot) => {
    projectSnapshot(options.dispatch, snapshot);
  });

  void options.client.current().then((current) => {
    if (current.ok) {
      projectSnapshot(options.dispatch, current.value);
      return;
    }
    options.dispatch(setSettingsConnectionState('disconnected'));
  });

  return () => {
    unsubscribeSnapshot?.();
    unsubscribeSnapshot = null;
    activeClient = null;
  };
};

export const resetSettingsProjectionSubscriptionForTests = (): void => {
  unsubscribeSnapshot?.();
  unsubscribeSnapshot = null;
  activeClient = null;
};
