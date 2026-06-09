import { describe, expect, it } from 'vitest';
import {
  addBlockedSite,
  endWorkingSession,
  markBlockedSitesLoaded,
  removeBlockedSite,
  setBlockedSites,
  startWorkingSession,
} from '../actions/blockedSitesActions';
import blockedSitesReducer from './blockedSitesReducer';

describe('blockedSitesReducer', () => {
  it('starts with default blocked sites unloaded and outside a working session', () => {
    const state = blockedSitesReducer(undefined, { type: 'test/init' });

    expect(state.sites).toContain('youtube.com');
    expect(state.sites).toContain('reddit.com');
    expect(state.isLoaded).toBe(false);
    expect(state.isInWorkingSession).toBe(false);
  });

  it('sets persisted sites and marks them loaded', () => {
    const state = blockedSitesReducer(
      undefined,
      setBlockedSites({
        sites: ['example.com'],
        isLoaded: false,
        isInWorkingSession: true,
      })
    );

    expect(state).toEqual({
      sites: ['example.com'],
      isLoaded: true,
      isInWorkingSession: false,
    });
  });

  it('adds unique blocked sites and ignores duplicates', () => {
    const withSite = blockedSitesReducer(undefined, addBlockedSite('news.example'));
    const withDuplicate = blockedSitesReducer(withSite, addBlockedSite('news.example'));

    expect(withDuplicate.sites.filter((site) => site === 'news.example')).toHaveLength(1);
  });

  it('removes blocked sites', () => {
    const withSite = blockedSitesReducer(undefined, addBlockedSite('news.example'));
    const state = blockedSitesReducer(withSite, removeBlockedSite('news.example'));

    expect(state.sites).not.toContain('news.example');
  });

  it('tracks loaded and working-session flags', () => {
    const loaded = blockedSitesReducer(undefined, markBlockedSitesLoaded());
    const working = blockedSitesReducer(loaded, startWorkingSession());
    const ended = blockedSitesReducer(working, endWorkingSession());

    expect(loaded.isLoaded).toBe(true);
    expect(working.isInWorkingSession).toBe(true);
    expect(ended.isInWorkingSession).toBe(false);
  });
});
