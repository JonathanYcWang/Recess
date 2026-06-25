import { describe, expect, it } from 'vitest';
import {
  setSettingsConnectionState,
  setSettingsProjection,
} from '../actions/settingsProjectionActions';
import settingsProjectionReducer from './settingsProjectionReducer';

describe('settingsProjectionReducer', () => {
  it('stores revision and connected state', () => {
    const state = settingsProjectionReducer(undefined, setSettingsProjection({ revision: 2 }));

    expect(state).toEqual({
      revision: 2,
      connectionState: 'connected',
    });
  });

  it('tracks disconnected connection state without clearing the projection', () => {
    const connected = settingsProjectionReducer(undefined, setSettingsProjection({ revision: 1 }));
    const disconnected = settingsProjectionReducer(
      connected,
      setSettingsConnectionState('disconnected')
    );

    expect(disconnected.revision).toBe(1);
    expect(disconnected.connectionState).toBe('disconnected');
  });
});
