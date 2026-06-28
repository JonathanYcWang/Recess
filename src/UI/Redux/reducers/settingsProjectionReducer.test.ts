import { describe, expect, it } from 'vitest';
import {
  setSettingsConnectionState,
  setSettingsProjection,
} from '../actions/settingsProjectionActions';
import settingsProjectionReducer from './settingsProjectionReducer';

describe('settingsProjectionReducer', () => {
  it('stores revision, theme preference, and connected state', () => {
    const state = settingsProjectionReducer(
      undefined,
      setSettingsProjection({ revision: 2, themePreference: 'dark' })
    );

    expect(state).toEqual({
      revision: 2,
      themePreference: 'dark',
      connectionState: 'connected',
    });
  });

  it('tracks disconnected connection state without clearing the projection', () => {
    const connected = settingsProjectionReducer(
      undefined,
      setSettingsProjection({ revision: 1, themePreference: 'light' })
    );
    const disconnected = settingsProjectionReducer(
      connected,
      setSettingsConnectionState('disconnected')
    );

    expect(disconnected.revision).toBe(1);
    expect(disconnected.themePreference).toBe('light');
    expect(disconnected.connectionState).toBe('disconnected');
  });
});
