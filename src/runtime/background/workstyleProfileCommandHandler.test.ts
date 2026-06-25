import { describe, expect, it } from 'vitest';
import { createInMemoryKeyValueAdapter } from '@/adapters/browser/in-memory/inMemoryKeyValueAdapter';
import { createBackgroundCompositionRoot } from '../background/backgroundCompositionRoot';
import { RUNTIME_PROTOCOL_VERSION } from '../protocol/types';
import { createWorkstyleProfileCommandEnvelope } from '../client/inProcessWorkstyleProfileClient';

import type { BackgroundCompositionRoot } from '../background/backgroundCompositionRoot';

const creditCoins = async (root: BackgroundCompositionRoot, amount: number) => {
  await root.coin.command({
    protocolVersion: RUNTIME_PROTOCOL_VERSION,
    commandId: `credit-${amount}-${Date.now()}`,
    module: 'coin',
    command: {
      kind: 'credit',
      transactionId: `credit-${amount}-${Date.now()}`,
      amount,
      recordedAt: Date.now(),
      reasonCode: 'work-session-streak',
    },
  });
};

describe('workstyleProfileCommandHandler', () => {
  it('initializes profile from onboarding and persists qualitative signals', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const root = await createBackgroundCompositionRoot({ adapter });
    if (!root.ok) {
      throw new Error('expected root');
    }

    const response = await root.value.workstyleProfile.command(
      createWorkstyleProfileCommandEnvelope({
        kind: 'initialize-from-onboarding',
        energy: 'high',
        cadence: '45/10',
        primaryFriction: 'starting',
      })
    );
    expect(response.ok).toBe(true);
    if (response.ok) {
      expect(response.snapshot.value.preferredCadence).toBe('45/10');
      expect(response.snapshot.value.energy).toBe('high');
      expect(response.snapshot.value.friction.starting).toBe('high');
      expect(response.snapshot.value.activePetId).toBeNull();
      expect(response.snapshot.value.ownedPetIds).toEqual([]);
    }
  });

  it('rejects pet reassignment after first assignment', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const root = await createBackgroundCompositionRoot({ adapter });
    if (!root.ok) {
      throw new Error('expected root');
    }

    await root.value.workstyleProfile.command(
      createWorkstyleProfileCommandEnvelope({ kind: 'assign-pet', petId: 'pet-flux' })
    );
    const switched = await root.value.workstyleProfile.command(
      createWorkstyleProfileCommandEnvelope({ kind: 'assign-pet', petId: 'pet-tide' })
    );
    expect(switched.ok).toBe(true);
    if (switched.ok) {
      expect(switched.snapshot.value.activePetId).toBe('pet-tide');
      expect(switched.snapshot.value.ownedPetIds).toEqual(['pet-flux', 'pet-tide']);
    }
  });

  it('purchases a mood boost for ten coins when balance is sufficient', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const root = await createBackgroundCompositionRoot({ adapter });
    if (!root.ok) {
      throw new Error('expected root');
    }

    await root.value.workstyleProfile.command(
      createWorkstyleProfileCommandEnvelope({ kind: 'assign-pet', petId: 'pet-flux' })
    );
    await creditCoins(root.value, 10);

    const boosted = await root.value.workstyleProfile.command(
      createWorkstyleProfileCommandEnvelope({ kind: 'purchase-pet-mood-boost' })
    );
    expect(boosted.ok).toBe(true);
    if (boosted.ok) {
      expect(boosted.snapshot.value.petMood.currentMood).toBe('happy');
    }

    const coin = await root.value.coin.current();
    expect(coin.ok).toBe(true);
    if (coin.ok) {
      expect(coin.value.value.balance).toBe(0);
    }
  });

  it('rejects mood boost purchases with insufficient balance', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const root = await createBackgroundCompositionRoot({ adapter });
    if (!root.ok) {
      throw new Error('expected root');
    }

    await root.value.workstyleProfile.command(
      createWorkstyleProfileCommandEnvelope({ kind: 'assign-pet', petId: 'pet-flux' })
    );

    const boosted = await root.value.workstyleProfile.command(
      createWorkstyleProfileCommandEnvelope({ kind: 'purchase-pet-mood-boost' })
    );
    expect(boosted).toMatchObject({
      ok: false,
      error: { kind: 'insufficient-coins', balance: 0, required: 10 },
    });
  });
});
