import { decideAccess, parseDestination, findMatchingBlockListEntry } from '@/modules/block-list';
import type {
  AccessSnapshot,
  BlockedAttemptReport,
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

const toBlockedAttempt = (
  snapshot: AccessSnapshot,
  tab: TabIdentity
): BlockedAttemptReport | null => {
  const destination = parseDestination(tab.url);
  if (destination.kind !== 'website') {
    return null;
  }
  const entry = findMatchingBlockListEntry(destination.hostname, snapshot.blockListEntries);
  if (!entry) {
    return null;
  }
  if (snapshot.accessContext.phase !== 'time-out') {
    return null;
  }
  if (snapshot.accessContext.hallPassEntry === entry) {
    return null;
  }
  return { destination: entry, url: tab.url };
};

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
    const blockedAttempts: BlockedAttemptReport[] = [];

    const query = await options.tabAccess.queryEligibleTabs();
    if (!query.ok) {
      return { kind: 'partial', closed, restored, blockedAttempts, error: query.error };
    }

    const tabsToClose = findTabsToClose(snapshot, query.value);
    if (tabsToClose.length > 0) {
      const remembered = await options.ownershipStore.read();
      const nextRemembered = {
        rememberedUrls: [...remembered.rememberedUrls, ...tabsToClose.map((tab) => tab.url)],
      };
      await options.ownershipStore.commit(nextRemembered);

      for (const tab of tabsToClose) {
        const attempt = toBlockedAttempt(snapshot, tab);
        if (attempt) {
          blockedAttempts.push(attempt);
        }
      }

      const closeResult = await options.tabAccess.closeTabs(tabsToClose);
      if (!closeResult.ok) {
        return { kind: 'partial', closed, restored, blockedAttempts, error: closeResult.error };
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
        return { kind: 'partial', closed, restored, blockedAttempts, error: openResult.error };
      }
      remaining.splice(index, 1);
      restored += 1;
    }
    await options.ownershipStore.commit({ rememberedUrls: remaining });

    return { kind: 'converged', closed, restored, blockedAttempts };
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
      return { kind: 'converged', closed: 0, restored: 0, blockedAttempts: [] };
    }

    reconciling = true;
    try {
      let result: EnforcementResult = {
        kind: 'converged',
        closed: 0,
        restored: 0,
        blockedAttempts: [],
      };
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
