import { decideAccess, parseDestination } from '@/modules/block-list';
import type {
  AccessSnapshot,
  EnforcementResult,
  RememberedOwnership,
  TabAccess,
  TabIdentity,
} from './types';

export interface EnforcementOwnershipStore {
  read(): Promise<RememberedOwnership>;
  commit(remembered: RememberedOwnership): Promise<void>;
}

export const createInMemoryOwnershipStore = (
  initial: RememberedOwnership = { rememberedUrls: [] }
): EnforcementOwnershipStore => {
  let remembered = { rememberedUrls: [...initial.rememberedUrls] };
  return {
    async read() {
      return { rememberedUrls: [...remembered.rememberedUrls] };
    },
    async commit(next) {
      remembered = { rememberedUrls: [...next.rememberedUrls] };
    },
  };
};

const shouldBlockTab = (snapshot: AccessSnapshot, tab: TabIdentity): boolean => {
  const destination = parseDestination(tab.url);
  if (destination.kind === 'private-browsing') {
    return false;
  }
  const decision = decideAccess(destination, snapshot.accessContext);
  return decision.outcome === 'block';
};

const findTabsToClose = (snapshot: AccessSnapshot, tabs: TabIdentity[]): TabIdentity[] =>
  tabs.filter((tab) => shouldBlockTab(snapshot, tab));

const findUrlsToRestore = (snapshot: AccessSnapshot, remembered: RememberedOwnership): string[] =>
  remembered.rememberedUrls.filter((url) => {
    const destination = parseDestination(url);
    const decision = decideAccess(destination, snapshot.accessContext);
    return decision.outcome === 'allow';
  });

export const createBlockListReconciler = (options: {
  tabAccess: TabAccess;
  ownershipStore: EnforcementOwnershipStore;
}) => {
  let reconciling = false;
  let pendingSnapshot: AccessSnapshot | null = null;
  let latestSnapshot: AccessSnapshot | null = null;

  const runOnce = async (snapshot: AccessSnapshot): Promise<EnforcementResult> => {
    let closed = 0;
    let restored = 0;

    const query = await options.tabAccess.queryEligibleTabs();
    if (!query.ok) {
      return { kind: 'partial', closed, restored, error: query.error };
    }

    const tabsToClose = findTabsToClose(snapshot, query.value);
    if (tabsToClose.length > 0) {
      const remembered = await options.ownershipStore.read();
      const nextRemembered = {
        rememberedUrls: [...remembered.rememberedUrls, ...tabsToClose.map((tab) => tab.url)],
      };
      await options.ownershipStore.commit(nextRemembered);

      const closeResult = await options.tabAccess.closeTabs(tabsToClose);
      if (!closeResult.ok) {
        return { kind: 'partial', closed, restored, error: closeResult.error };
      }
      closed = closeResult.value.closed.length;
    }

    const remembered = await options.ownershipStore.read();
    const urlsToRestore = findUrlsToRestore(snapshot, remembered);
    const remaining = [...remembered.rememberedUrls];
    for (const url of urlsToRestore) {
      const index = remaining.indexOf(url);
      if (index === -1) {
        continue;
      }
      const openResult = await options.tabAccess.openInactiveTab(url);
      if (!openResult.ok) {
        return { kind: 'partial', closed, restored, error: openResult.error };
      }
      remaining.splice(index, 1);
      restored += 1;
    }
    await options.ownershipStore.commit({ rememberedUrls: remaining });

    return { kind: 'converged', closed, restored };
  };

  const reconcile = async (snapshot: AccessSnapshot): Promise<EnforcementResult> => {
    latestSnapshot = snapshot;
    if (reconciling) {
      pendingSnapshot = snapshot;
      while (reconciling) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
      if (pendingSnapshot) {
        return reconcile(pendingSnapshot);
      }
      return { kind: 'converged', closed: 0, restored: 0 };
    }

    reconciling = true;
    try {
      let result: EnforcementResult = { kind: 'converged', closed: 0, restored: 0 };
      do {
        pendingSnapshot = null;
        const active = latestSnapshot ?? snapshot;
        result = await runOnce(active);
      } while (pendingSnapshot);
      return result;
    } finally {
      reconciling = false;
    }
  };

  return {
    reconcile,
    getLatestSnapshot: () => latestSnapshot,
  };
};
