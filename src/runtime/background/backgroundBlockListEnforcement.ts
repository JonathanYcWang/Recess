import { createChromiumKeyValueAdapter } from '@/adapters/browser/chromium/chromiumKeyValueAdapter';
import { createSafariCompatibleTabAccessAdapter } from '@/adapters/browser/safari/safariTabAccessAdapter';
import type { AccessContext } from '@/modules/block-list';
import { createBlockListReconciler, type AccessSnapshot } from '@/modules/block-list-enforcement';
import { ACCESS_CONTEXT_STORAGE_KEY } from '@/runtime/accessContextStorage';
import { registerBlockListRuntimeListener } from './blockListRuntimeListener';
import { getSharedBackgroundCompositionRoot } from './sharedCompositionRoot';
import { createPersistedOwnershipStore } from './persistedOwnershipStore';

const readPublishedAccessContext = async (): Promise<AccessContext | null> => {
  const data = await chrome.storage.local.get([ACCESS_CONTEXT_STORAGE_KEY]);
  const context = data[ACCESS_CONTEXT_STORAGE_KEY] as AccessContext | undefined;
  return context ?? null;
};

export const registerBlockListEnforcement = (): void => {
  const adapter = createChromiumKeyValueAdapter();
  const tabAccess = createSafariCompatibleTabAccessAdapter();
  if (!tabAccess) {
    return;
  }

  registerBlockListRuntimeListener({
    adapter,
    runtime: chrome.runtime,
  });

  const ownershipStore = createPersistedOwnershipStore(adapter);
  const reconciler = createBlockListReconciler({ tabAccess, ownershipStore });

  let reconciling = false;
  let pending = false;

  const buildSnapshot = async (): Promise<AccessSnapshot | null> => {
    const root = await getSharedBackgroundCompositionRoot(adapter);
    if (!root.ok) {
      return null;
    }
    const current = root.value.blockListHandler.current();
    if (!current.ok) {
      return null;
    }
    const accessContext = await readPublishedAccessContext();
    if (!accessContext) {
      return null;
    }
    const remembered = await ownershipStore.read();
    return {
      revision: current.value.revision,
      blockListEntries: current.value.value.entries,
      accessContext,
      remembered,
    };
  };

  const reconcileLatest = async (): Promise<void> => {
    if (reconciling) {
      pending = true;
      return;
    }
    reconciling = true;
    try {
      do {
        pending = false;
        const snapshot = await buildSnapshot();
        if (snapshot) {
          await reconciler.reconcile(snapshot);
        }
      } while (pending);
    } finally {
      reconciling = false;
    }
  };

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') {
      return;
    }
    if (changes[ACCESS_CONTEXT_STORAGE_KEY]) {
      void reconcileLatest();
    }
  });

  void getSharedBackgroundCompositionRoot(adapter).then((root) => {
    if (!root.ok) {
      return;
    }
    root.value.blockListHandler.subscribe(() => {
      void reconcileLatest();
    });
    void reconcileLatest();
  });

  chrome.tabs.onUpdated.addListener((_tabId, changeInfo) => {
    if (changeInfo.url || changeInfo.status === 'complete') {
      void reconcileLatest();
    }
  });
};
