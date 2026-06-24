import { describe, expect, it } from 'vitest';
import { createInMemoryKeyValueAdapter } from '@/adapters/browser/in-memory/inMemoryKeyValueAdapter';
import { createBackgroundCompositionRoot } from '../background/backgroundCompositionRoot';
import { createWorkstyleProfileCommandEnvelope } from '../client/inProcessWorkstyleProfileClient';

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
      expect(response.snapshot.value.assignedPetId).toBeNull();
    }
  });

  it('rejects pet reassignment after first assignment', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const root = await createBackgroundCompositionRoot({ adapter });
    if (!root.ok) {
      throw new Error('expected root');
    }

    await root.value.workstyleProfile.command(
      createWorkstyleProfileCommandEnvelope({ kind: 'assign-pet', petId: 'theo' })
    );
    const replaced = await root.value.workstyleProfile.command(
      createWorkstyleProfileCommandEnvelope({ kind: 'assign-pet', petId: 'other' })
    );
    expect(replaced).toMatchObject({
      ok: false,
      error: { kind: 'pet-already-assigned' },
    });
  });
});
