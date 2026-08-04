import { describe, expect, it, vi } from 'vitest';

vi.mock('webextension-polyfill', () => ({
  default: {
    tabs: { query: vi.fn(), remove: vi.fn(), onUpdated: { addListener: vi.fn() } },
    runtime: { sendMessage: vi.fn() },
  },
}));

import { SCHEDULER_PHASE, WORK_SESSION_DURATION } from '@/Shared/Constants/Constants';
import { createDefaultPersistedAppState } from '@/Shared/State/defaults';
import { parsePersistedAppState } from '@/Shared/Schema/PersistedAppStateSchema';

describe('parsePersistedAppState', () => {
  it('returns valid stored state', () => {
    const stored = createDefaultPersistedAppState();
    expect(parsePersistedAppState(stored)).toEqual(stored);
  });

  it('returns defaults when storage is invalid', () => {
    expect(parsePersistedAppState(null)).toEqual(createDefaultPersistedAppState());
    expect(parsePersistedAppState({ coin: 5 })).toEqual(createDefaultPersistedAppState());
  });

  it('rejects invalid scheduler phase values', () => {
    const stored = createDefaultPersistedAppState();
    expect(
      parsePersistedAppState({
        ...stored,
        scheduler: { ...stored.scheduler, activePhase: 'INVALID' },
      })
    ).toEqual(createDefaultPersistedAppState());
  });

  it('ignores unknown top-level keys when shape is otherwise valid', () => {
    const stored = createDefaultPersistedAppState();
    expect(
      parsePersistedAppState({
        ...stored,
        coin: 99,
      })
    ).toEqual(stored);
  });

  it('accepts a populated scheduler state and syncs block list enforcement flags', () => {
    const stored = {
      ...createDefaultPersistedAppState(),
      scheduler: {
        activePhase: SCHEDULER_PHASE.FOCUS_BLOCK,
        phaseStart: '2026-01-01T12:00:00.000Z',
        phaseTarget: 1500,
        workSessionTarget: WORK_SESSION_DURATION,
        workSessionRemaining: WORK_SESSION_DURATION,
      },
    };

    expect(parsePersistedAppState(stored)).toEqual({
      ...stored,
      blockList: stored.blockList.map((entry) => ({ ...entry, isBlocked: true })),
    });
  });

  it('migrates legacy block list entries arrays', () => {
    const stored = createDefaultPersistedAppState();
    expect(
      parsePersistedAppState({
        ...stored,
        blockList: { entries: ['youtube.com', 'instagram.com'] },
      }).blockList.map((entry) => entry.url)
    ).toEqual(['youtube.com', 'instagram.com']);
  });
});
