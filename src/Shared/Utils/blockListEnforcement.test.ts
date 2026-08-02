import { describe, expect, it } from 'vitest';
import { SCHEDULER_PHASE } from '@/Shared/Constants/Constants';
import { createDefaultPersistedAppState } from '@/Shared/Schema/PersistedAppStateSchema';
import type { BlockListEntry, PersistedAppState, Reward } from '@/Shared/Types/AppState';
import { isBlocked, applyBlockListEnforcement, findBlockListEntry } from '@/Shared/Utils/blockListEnforcement';

const withBlockListContext = (
  blockList: BlockListEntry[],
  activePhase: PersistedAppState['scheduler']['activePhase'],
  selectedRecess: Reward | null
): PersistedAppState => ({
  ...createDefaultPersistedAppState(),
  blockList,
  scheduler: {
    ...createDefaultPersistedAppState().scheduler,
    activePhase,
  },
  recessPicker: {
    ...createDefaultPersistedAppState().recessPicker,
    selectedRecess,
  },
});

describe('applyBlockListEnforcement', () => {
  const entries = [{ url: 'youtube.com', isBlocked: false }, { url: 'instagram.com', isBlocked: false }];

  it('clears isBlocked when there is no active phase', () => {
    expect(
      applyBlockListEnforcement(withBlockListContext(entries, null, null)).blockList
    ).toEqual([
      { url: 'youtube.com', isBlocked: false },
      { url: 'instagram.com', isBlocked: false },
    ]);
  });

  it('blocks every entry during Focus Block and Reward Game', () => {
    expect(
      applyBlockListEnforcement(withBlockListContext(entries, SCHEDULER_PHASE.FOCUS_BLOCK, null))
        .blockList
    ).toEqual([
      { url: 'youtube.com', isBlocked: true },
      { url: 'instagram.com', isBlocked: true },
    ]);
    expect(
      applyBlockListEnforcement(withBlockListContext(entries, SCHEDULER_PHASE.REWARD_GAME, null))
        .blockList
    ).toEqual([
      { url: 'youtube.com', isBlocked: true },
      { url: 'instagram.com', isBlocked: true },
    ]);
  });

  it('allows only the selected recess entry during Recess', () => {
    const selectedRecess = { id: '1', name: 'youtube.com', duration: 10 };

    expect(
      applyBlockListEnforcement(
        withBlockListContext(entries, SCHEDULER_PHASE.RECESS, selectedRecess)
      ).blockList
    ).toEqual([
      { url: 'youtube.com', isBlocked: false },
      { url: 'instagram.com', isBlocked: true },
    ]);
  });

  it('blocks every entry during Recess when nothing is selected', () => {
    expect(
      applyBlockListEnforcement(withBlockListContext(entries, SCHEDULER_PHASE.RECESS, null))
        .blockList
    ).toEqual([
      { url: 'youtube.com', isBlocked: true },
      { url: 'instagram.com', isBlocked: true },
    ]);
  });

  it('derives flags from scheduler and recess picker on the full state', () => {
    const state = applyBlockListEnforcement({
      ...createDefaultPersistedAppState(),
      scheduler: {
        ...createDefaultPersistedAppState().scheduler,
        activePhase: SCHEDULER_PHASE.FOCUS_BLOCK,
      },
    });

    expect(state.blockList.every((entry) => entry.isBlocked)).toBe(true);
  });
});

describe('findBlockListEntry', () => {
  const blockList = [{ url: 'youtube.com', isBlocked: true }];

  it('matches exact hostnames and subdomains', () => {
    expect(findBlockListEntry(blockList, 'youtube.com')?.url).toBe('youtube.com');
    expect(findBlockListEntry(blockList, 'www.youtube.com')?.url).toBe('youtube.com');
    expect(findBlockListEntry(blockList, 'evil-youtube.com')).toBeUndefined();
  });

  it('normalizes a tab URL before matching', () => {
    expect(findBlockListEntry(blockList, 'https://www.youtube.com/watch?v=1')?.url).toBe(
      'youtube.com'
    );
  });

  it('returns undefined for unenforceable URLs', () => {
    expect(findBlockListEntry(blockList, 'chrome://newtab/')).toBeUndefined();
  });
});

describe('tab block lookup after applyBlockListEnforcement', () => {
  const tabIsBlocked = (state: PersistedAppState, hostnameOrUrl: string): boolean =>
    findBlockListEntry(state.blockList, hostnameOrUrl)?.isBlocked === true;

  it('does not block when there is no active scheduler phase', () => {
    const state = applyBlockListEnforcement(
      withBlockListContext([{ url: 'youtube.com', isBlocked: false }], null, null)
    );

    expect(tabIsBlocked(state, 'www.youtube.com')).toBe(false);
  });

  it('does not block hostnames that are not on the list', () => {
    const state = applyBlockListEnforcement(
      withBlockListContext([{ url: 'youtube.com', isBlocked: false }], SCHEDULER_PHASE.FOCUS_BLOCK, null)
    );

    expect(tabIsBlocked(state, 'example.com')).toBe(false);
  });

  it('blocks list matches during Focus Block using subdomain rules', () => {
    const state = applyBlockListEnforcement(
      withBlockListContext([{ url: 'youtube.com', isBlocked: false }], SCHEDULER_PHASE.FOCUS_BLOCK, null)
    );

    expect(tabIsBlocked(state, 'www.youtube.com')).toBe(true);
  });

  it('allows only the selected recess site during Recess', () => {
    const selectedRecess = { id: '1', name: 'youtube.com', duration: 10 };
    const state = applyBlockListEnforcement(
      withBlockListContext(
        [
          { url: 'youtube.com', isBlocked: false },
          { url: 'instagram.com', isBlocked: false },
        ],
        SCHEDULER_PHASE.RECESS,
        selectedRecess
      )
    );

    expect(tabIsBlocked(state, 'www.youtube.com')).toBe(false);
    expect(tabIsBlocked(state, 'instagram.com')).toBe(true);
  });
});

describe('isBlocked', () => {
  it('derives a single entry flag from phase and recess selection', () => {
    const selectedRecess = { id: '1', name: 'youtube.com', duration: 10 };
    expect(isBlocked('youtube.com', SCHEDULER_PHASE.RECESS, selectedRecess)).toBe(false);
    expect(isBlocked('instagram.com', SCHEDULER_PHASE.RECESS, selectedRecess)).toBe(true);
  });
});
