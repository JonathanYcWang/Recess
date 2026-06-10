import { describe, expect, it } from 'vitest';
import { addBlockedSite, removeBlockedSite, setBlockedSites } from '../actions/blockedSitesActions';
import blockedSitesReducer from './blockedSitesReducer';

describe('blockedSitesReducer', () => {
  it('starts with default blocked sites', () => {
    const state = blockedSitesReducer(undefined, { type: 'test/init' });

    expect(state).toContain('youtube.com');
    expect(state).toContain('reddit.com');
  });

  it('sets persisted sites', () => {
    const state = blockedSitesReducer(undefined, setBlockedSites(['example.com']));

    expect(state).toEqual(['example.com']);
  });

  it('adds unique blocked sites and ignores duplicates', () => {
    const withSite = blockedSitesReducer(undefined, addBlockedSite('news.example'));
    const withDuplicate = blockedSitesReducer(withSite, addBlockedSite('news.example'));

    expect(withDuplicate.filter((site) => site === 'news.example')).toHaveLength(1);
  });

  it('removes blocked sites', () => {
    const withSite = blockedSitesReducer(undefined, addBlockedSite('news.example'));
    const state = blockedSitesReducer(withSite, removeBlockedSite('news.example'));

    expect(state).not.toContain('news.example');
  });
});
