import {
  type AppAction,
  type AppActionResponse,
  type BackgroundRequest,
  type RuntimeMessage,
  type PersistedAppState,
} from '@/Shared/Types/AppState';

export const getAppState = async (): Promise<PersistedAppState> =>
  chrome.runtime.sendMessage({ type: 'GET_APP_STATE' } satisfies BackgroundRequest);

export const sendAppAction = async (action: AppAction): Promise<AppActionResponse> =>
  chrome.runtime.sendMessage({
    type: 'APP_ACTION',
    action,
  } satisfies BackgroundRequest);

export const subscribeToAppState = (listener: (state: PersistedAppState) => void): (() => void) => {
  const onMessage = (message: RuntimeMessage): void => {
    if (message.type === 'APP_STATE_CHANGED') {
      listener(message.state);
    }
  };

  chrome.runtime.onMessage.addListener(onMessage);
  return () => chrome.runtime.onMessage.removeListener(onMessage);
};
