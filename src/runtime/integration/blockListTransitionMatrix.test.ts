import { describe, expect, it } from 'vitest';
import type { AccessContext, AccessPhase } from '@/modules/block-list';
import {
  addInMemoryTab,
  createBlockListReconciler,
  createInMemoryOwnershipStore,
  createInMemoryTabAccess,
  createInMemoryTabAccessState,
} from '@/modules/block-list-enforcement';

const transitionCases: Array<{
  name: string;
  from: AccessContext;
  to: AccessContext;
  remembered: string[];
  openUrls: string[];
  expectRestored: number;
  expectClosed: number;
}> = [
  {
    name: 'grants hall pass restoration',
    from: {
      phase: 'time-out',
      blockListEntries: ['blocked.test'],
      recessPassEntry: null,
      hallPassEntry: null,
    },
    to: {
      phase: 'time-out',
      blockListEntries: ['blocked.test'],
      recessPassEntry: null,
      hallPassEntry: 'blocked.test',
    },
    remembered: ['https://blocked.test/a'],
    openUrls: [],
    expectRestored: 1,
    expectClosed: 0,
  },
  {
    name: 'grants recess pass restoration',
    from: {
      phase: 'focus-block',
      blockListEntries: ['blocked.test'],
      recessPassEntry: null,
      hallPassEntry: null,
    },
    to: {
      phase: 'recess',
      blockListEntries: ['blocked.test'],
      recessPassEntry: 'blocked.test',
      hallPassEntry: null,
    },
    remembered: ['https://blocked.test/a'],
    openUrls: [],
    expectRestored: 1,
    expectClosed: 0,
  },
  {
    name: 'restores all remembered URLs when work session ends',
    from: {
      phase: 'focus-block',
      blockListEntries: ['blocked.test'],
      recessPassEntry: null,
      hallPassEntry: null,
    },
    to: {
      phase: 'work-session-ended',
      blockListEntries: ['blocked.test'],
      recessPassEntry: null,
      hallPassEntry: null,
    },
    remembered: ['https://blocked.test/a', 'https://blocked.test/b'],
    openUrls: [],
    expectRestored: 2,
    expectClosed: 0,
  },
  {
    name: 're-closes tabs when back to work countdown resumes enforcement',
    from: {
      phase: 'recess',
      blockListEntries: ['blocked.test'],
      recessPassEntry: 'blocked.test',
      hallPassEntry: null,
    },
    to: {
      phase: 'back-to-work-countdown',
      blockListEntries: ['blocked.test'],
      recessPassEntry: null,
      hallPassEntry: null,
    },
    remembered: [],
    openUrls: ['https://blocked.test/live'],
    expectRestored: 0,
    expectClosed: 1,
  },
];

describe('block list policy transition matrix', () => {
  it.each(transitionCases)(
    '$name',
    async ({ from, to, remembered, openUrls, expectRestored, expectClosed }) => {
      const state = createInMemoryTabAccessState();
      for (const url of openUrls) {
        addInMemoryTab(state, { url, active: true, incognito: false });
      }
      const ownershipStore = createInMemoryOwnershipStore({ rememberedUrls: remembered });
      const reconciler = createBlockListReconciler({
        tabAccess: createInMemoryTabAccess(state),
        ownershipStore,
      });

      await reconciler.reconcile({
        revision: 1,
        blockListEntries: from.blockListEntries,
        accessContext: from,
        remembered: { rememberedUrls: remembered },
      });
      const result = await reconciler.reconcile({
        revision: 2,
        blockListEntries: to.blockListEntries,
        accessContext: to,
        remembered: await ownershipStore.read(),
      });

      expect(result).toMatchObject({
        kind: 'converged',
        closed: expectClosed,
        restored: expectRestored,
      });
    }
  );

  it('maps every enforced phase through typed fixtures', () => {
    const enforcedPhases: AccessPhase[] = [
      'focus-block',
      'reward-game',
      'back-to-work-countdown',
      'time-out',
      'recess',
    ];
    expect(enforcedPhases).toHaveLength(5);
  });
});
