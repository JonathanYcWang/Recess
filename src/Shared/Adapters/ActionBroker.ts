import type {
  AppCommand,
  AppCommandResponse,
  AppStateMessage,
  PersistedAppState,
} from '../../Shared/Types/AppState';

export const getAppState = async (): Promise<PersistedAppState> =>
  chrome.runtime.sendMessage({ type: 'GET_APP_STATE' } satisfies AppStateMessage);

export const sendAppCommand = async (command: AppCommand): Promise<AppCommandResponse> =>
  chrome.runtime.sendMessage({
    type: 'APP_COMMAND',
    command,
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
