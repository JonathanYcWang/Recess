import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import type { ThemePreference } from '@/modules/persisted-application-state';
import type { SettingsClientCommandResult } from '@/runtime';
import { createAppSettingsClient } from '@/store/settingsClient';
import {
  selectRenderableThemePreference,
  selectSettingsConnectionState,
  selectSettingsRevision,
} from '@/store/selectors/settingsProjectionSelectors';

export const useSettings = () => {
  const revision = useSelector(selectSettingsRevision);
  const themePreference = useSelector(selectRenderableThemePreference);
  const connectionState = useSelector(selectSettingsConnectionState);

  const setThemePreference = useCallback(
    async (preference: ThemePreference): Promise<SettingsClientCommandResult> => {
      const client = createAppSettingsClient();
      if (!client) {
        return { ok: false, error: { kind: 'missing-receiver' } };
      }
      return client.setThemePreference(preference, {
        expectedRevision: revision ?? undefined,
      });
    },
    [revision]
  );

  return {
    revision,
    themePreference,
    connectionState,
    setThemePreference,
  };
};
