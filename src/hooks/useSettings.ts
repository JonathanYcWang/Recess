import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { retrySettingsConnection } from '@/store/settingsConnectionManager';
import {
  selectSettingsConnectionState,
  selectSettingsRevision,
} from '@/store/selectors/settingsProjectionSelectors';

export const useSettings = () => {
  const revision = useSelector(selectSettingsRevision);
  const connectionState = useSelector(selectSettingsConnectionState);
  const isReadOnly = connectionState === 'disconnected';

  const retryConnection = useCallback(async () => {
    await retrySettingsConnection();
  }, []);

  return {
    revision,
    connectionState,
    isReadOnly,
    retryConnection,
  };
};
