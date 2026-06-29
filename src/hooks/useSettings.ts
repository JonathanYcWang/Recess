import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import type { ThemePreference } from '@/runtime/persistence';
import type { SettingsClientCommandResult } from '@/runtime';
import { createAppSettingsClient } from '@/store/settingsClient';
import { retrySettingsConnection } from '@/store/settingsConnectionManager';
import {
  selectRenderableThemePreference,
  selectSettingsConnectionState,
  selectSettingsRevision,
} from '@/store/selectors/settingsProjectionSelectors';

export const useSettings = () => {
  const revision = useSelector(selectSettingsRevision);
  const themePreference = useSelector(selectRenderableThemePreference);
  const connectionState = useSelector(selectSettingsConnectionState);
  const isReadOnly = connectionState === 'disconnected';

  const setThemePreference = useCallback(
    async (preference: ThemePreference): Promise<SettingsClientCommandResult> => {
      if (isReadOnly) {
        return { ok: false, error: { kind: 'transport-unavailable' } };
      }
      const client = createAppSettingsClient();
      if (!client) {
        return { ok: false, error: { kind: 'missing-receiver' } };
      }
      return client.setThemePreference(preference, {
        expectedRevision: revision ?? undefined,
      });
    },
    [isReadOnly, revision]
  );

  const retryConnection = useCallback(async () => {
    await retrySettingsConnection();
  }, []);

  return {
    revision,
    themePreference,
    connectionState,
    isReadOnly,
    setThemePreference,
    retryConnection,
  };
};
