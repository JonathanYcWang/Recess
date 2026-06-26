import type { AccessContext } from '@/modules/block-list';
import { ACCESS_CONTEXT_STORAGE_KEY } from '@/runtime/accessContextStorage';

import type { RootState } from './index';

export const projectAccessContextFromState = (state: RootState): AccessContext => ({
  phase: 'focus-block',
  blockListEntries: state.blockedSites,
  recessPassEntry: null,
  hallPassEntry: null,
});

export const publishAccessContext = async (accessContext: AccessContext): Promise<void> => {
  if (!chrome.storage?.local) {
    return;
  }

  await chrome.storage.local.set({
    [ACCESS_CONTEXT_STORAGE_KEY]: accessContext,
  });
};
