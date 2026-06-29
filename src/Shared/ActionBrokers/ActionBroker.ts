import type {
  AppAction,
  AppActionResponse,
  AppStateMessage,
  PersistedAppState,
} from '../../Shared/Types/AppState';

export const getAppState = async (): Promise<PersistedAppState> =>
  chrome.runtime.sendMessage({ type: 'GET_APP_STATE' } satisfies AppStateMessage);

export const sendAppAction = async (action: AppAction): Promise<AppActionResponse> =>
  chrome.runtime.sendMessage({
    type: 'APP_ACTION',
    action,
  } satisfies AppStateMessage);

export const subscribeToAppState = (listener: (state: PersistedAppState) => void): (() => void) => {
  const onMessage = (message: AppStateMessage): void => {
    if (message.type === 'APP_STATE_CHANGED') {
      listener(message.state);
    }
  };

  chrome.runtime.onMessage.addListener(onMessage);

  return () => chrome.runtime.onMessage.removeListener(onMessage);
};
