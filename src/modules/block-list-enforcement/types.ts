import type { AccessContext } from '@/modules/block-list';
import type { Result } from '@/modules/persisted-application-state';

export interface TabIdentity {
  tabId: number;
  url: string;
}

export type TabAccessError =
  | { kind: 'unavailable' }
  | { kind: 'permission-denied' }
  | { kind: 'invalid-tab' }
  | { kind: 'partial-failure'; failedTabIds: number[] }
  | { kind: 'open-failed'; url: string; cause?: string };

export type TabAccessResult<T> = Result<T, TabAccessError>;

export interface CloseTabsResult {
  closed: TabIdentity[];
  failed: number[];
}

export interface OpenTabResult {
  tabId: number;
  url: string;
}

export interface TabAccess {
  queryEligibleTabs(): Promise<TabAccessResult<TabIdentity[]>>;
  closeTabs(tabs: TabIdentity[]): Promise<TabAccessResult<CloseTabsResult>>;
  openInactiveTab(url: string): Promise<TabAccessResult<OpenTabResult>>;
}

export interface RememberedOwnership {
  rememberedUrls: string[];
}

export interface AccessSnapshot {
  revision: number;
  blockListEntries: readonly string[];
  accessContext: AccessContext;
  remembered: RememberedOwnership;
}

export type EnforcementResult =
  | { kind: 'converged'; closed: number; restored: number; blockedAttempts: BlockedAttemptReport[] }
  | {
      kind: 'partial';
      closed: number;
      restored: number;
      blockedAttempts: BlockedAttemptReport[];
      error: TabAccessError;
    };

export interface BlockedAttemptReport {
  destination: string;
  url: string;
}
