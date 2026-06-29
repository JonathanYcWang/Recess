import type { Result } from '@/runtime/persistence';

export interface BrowserActivityTab {
  tabId: number;
  windowId: number;
  url: string;
  active: boolean;
}

export interface BrowserActivityState {
  focusedWindowId: number | null;
  activeTab: BrowserActivityTab | null;
}

export type BrowserActivityError = { kind: 'unavailable' } | { kind: 'permission-denied' };

export type BrowserActivityResult<T> = Result<T, BrowserActivityError>;

export interface BrowserActivityAdapter {
  queryState(): Promise<BrowserActivityResult<BrowserActivityState>>;
  subscribe(listener: (state: BrowserActivityState) => void): () => void;
}
