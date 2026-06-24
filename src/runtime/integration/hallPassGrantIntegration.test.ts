import { describe, expect, it } from 'vitest';
import { createBackgroundCompositionRoot } from '@/runtime/background/backgroundCompositionRoot';
import { createInMemoryKeyValueAdapter } from '@/adapters/browser/in-memory/inMemoryKeyValueAdapter';
import {
  createBlockListReconciler,
  createInMemoryOwnershipStore,
  createInMemoryTabAccess,
  createInMemoryTabAccessState,
} from '@/modules/block-list-enforcement';
import { projectBackgroundAccessContext } from '@/runtime/background/backgroundAccessContext';
import { RUNTIME_PROTOCOL_VERSION } from '@/runtime/protocol/types';
import { startTimeOutCommandId } from '@/modules/work-rhythm';
import { createWorkRhythmCommandEnvelope } from '@/runtime/client/inProcessWorkRhythmClient';
import { createPersistedApplicationState } from '@/modules/persisted-application-state';

describe('hall pass grant integration', () => {
  it('confirms a hall pass and restores blocked tabs for one destination', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const persistence = createPersistedApplicationState({ adapter });
    const initialized = await persistence.initialize();
    if (!initialized.ok) {
      throw new Error('persistence init failed');
    }
    const profile = initialized.value.documents['workstyle-profile'];
    await persistence.commit([
      {
        document: 'workstyle-profile',
        expectedRevision: profile.revision,
        value: { ...profile.value, preferredCadence: '25/5' },
      },
    ]);

    const root = await createBackgroundCompositionRoot({ adapter });
    if (!root.ok) {
      throw new Error('composition root failed');
    }

    await root.value.coinHandler.execute({
      protocolVersion: RUNTIME_PROTOCOL_VERSION,
      commandId: 'seed-coins',
      module: 'coin',
      command: {
        kind: 'credit',
        transactionId: 'seed-coins',
        amount: 3,
        recordedAt: 0,
        reasonCode: 'standard-focus',
      },
    });

    await root.value.blockListHandler.execute({
      protocolVersion: RUNTIME_PROTOCOL_VERSION,
      commandId: 'add-blocked',
      module: 'block-list',
      command: { kind: 'add-entry', input: 'blocked.test' },
    });

    const started = await root.value.workRhythmHandler.execute({
      protocolVersion: RUNTIME_PROTOCOL_VERSION,
      commandId: 'start-session',
      module: 'work-rhythm',
      command: { kind: 'start-work-session', goalSeconds: 3600, energy: 'steady' },
    });
    expect(started.ok).toBe(true);
    if (!started.ok || started.snapshot.snapshot.phase !== 'focus-block') {
      throw new Error('expected focus block');
    }

    const timedOut = await root.value.workRhythmHandler.execute(
      createWorkRhythmCommandEnvelope(
        { kind: 'start-time-out' },
        { commandId: startTimeOutCommandId(started.snapshot.snapshot.sessionId) }
      )
    );
    expect(timedOut.ok).toBe(true);

    const report = await root.value.hallPassHandler.reportBlockedAttempt({
      url: 'https://blocked.test/page',
      requestId: 'blocked-req-1',
      reportedAtEpochMs: 2000,
      blockListEntries: ['blocked.test'],
      isTimeOut: true,
    });
    expect(report.ok).toBe(true);

    const granted = await root.value.hallPassHandler.execute({
      protocolVersion: RUNTIME_PROTOCOL_VERSION,
      commandId: 'grant-pass',
      module: 'hall-pass',
      command: {
        kind: 'confirm-grant',
        requestId: 'blocked-req-1',
        passId: 'pass-1',
        grantedAtEpochMs: 3000,
      },
    });
    expect(granted.ok).toBe(true);

    const workRhythm = root.value.workRhythmHandler.current();
    const blockList = root.value.blockListHandler.current();
    const hallPass = root.value.hallPassHandler.current();
    if (!workRhythm.ok || !blockList.ok || !hallPass.ok) {
      throw new Error('expected snapshots');
    }

    const accessContext = projectBackgroundAccessContext({
      workRhythmSnapshot: workRhythm.value.snapshot,
      blockListEntries: blockList.value.value.entries,
      hallPassEntry: hallPass.value.hallPassEntry,
    });
    expect(accessContext.hallPassEntry).toBe('blocked.test');

    const tabState = createInMemoryTabAccessState();
    const ownershipStore = createInMemoryOwnershipStore({
      rememberedUrls: ['https://blocked.test/page'],
    });
    const reconciler = createBlockListReconciler({
      tabAccess: createInMemoryTabAccess(tabState),
      ownershipStore,
    });
    const restored = await reconciler.reconcile({
      revision: 1,
      blockListEntries: blockList.value.value.entries,
      accessContext,
      remembered: await ownershipStore.read(),
    });
    expect(restored).toMatchObject({ kind: 'converged', restored: 1 });
  });
});
