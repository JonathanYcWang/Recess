import { createChromiumKeyValueAdapter } from '@/adapters/browser/chromium/chromiumKeyValueAdapter';
import { createSafariCompatibleTabAccessAdapter } from '@/adapters/browser/safari/safariTabAccessAdapter';
import { createBlockListReconciler, type AccessSnapshot } from '@/modules/block-list-enforcement';
import { ACCESS_CONTEXT_STORAGE_KEY } from '@/runtime/accessContextStorage';
import { publishAccessContext } from '@/store/accessContextPublisher';
import { registerBlockListRuntimeListener } from './blockListRuntimeListener';
import { getSharedBackgroundCompositionRoot } from './sharedCompositionRoot';
import { createPersistedOwnershipStore } from './persistedOwnershipStore';
import { projectBackgroundAccessContext } from './backgroundAccessContext';

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
    const workRhythm = root.value.workRhythmHandler.current();
    if (!workRhythm.ok) {
      return null;
    }
    const hallPass = root.value.hallPassHandler.current();
    const hallPassEntry = hallPass.ok ? hallPass.value.hallPassEntry : null;
    const accessContext = projectBackgroundAccessContext({
      workRhythmSnapshot: workRhythm.value.snapshot,
      blockListEntries: current.value.value.entries,
      hallPassEntry,
    });
    void publishAccessContext(accessContext);
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
          const result = await reconciler.reconcile(snapshot);
          if (result.blockedAttempts.length > 0) {
            const root = await getSharedBackgroundCompositionRoot(adapter);
            if (root.ok) {
              const now = Date.now();
              for (const attempt of result.blockedAttempts) {
                void root.value.hallPassHandler.reportBlockedAttempt({
                  url: attempt.url,
                  requestId: `blocked-${attempt.destination}-${now}`,
                  reportedAtEpochMs: now,
                  blockListEntries: snapshot.blockListEntries,
                  isTimeOut: snapshot.accessContext.phase === 'time-out',
                });
              }
            }
          }
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
    root.value.workRhythmHandler.subscribe(() => {
      void reconcileLatest();
    });
    root.value.hallPassHandler.subscribe(() => {
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
