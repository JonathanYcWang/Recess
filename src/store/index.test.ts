import { describe, expect, it } from 'vitest';
import { store } from './index';

describe('Redux store', () => {
  it('registers all expected slices', () => {
    expect(Object.keys(store.getState()).sort()).toEqual([
      'blockListProjection',
      'blockedSites',
      'quiz',
      'routing',
      'settingsProjection',
      'timer',
      'workHours',
    ]);
  });
});
