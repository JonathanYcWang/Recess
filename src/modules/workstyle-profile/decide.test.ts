import { describe, expect, it } from 'vitest';
import { applyWorkstyleProfileCommand } from './decide';
import { createDefaultWorkstyleProfileValue } from './workstyleProfileDocument';

describe('applyWorkstyleProfileCommand', () => {
  it('updates approved qualitative signals', () => {
    const current = createDefaultWorkstyleProfileValue();
    const energy = applyWorkstyleProfileCommand(current, {
      kind: 'update-energy',
      energy: 'high',
    });
    expect(energy.ok).toBe(true);
    if (energy.ok) {
      expect(energy.value.energy).toBe('high');
    }
  });

  it('initializes onboarding values without assigning a pet', () => {
    const current = createDefaultWorkstyleProfileValue();
    const initialized = applyWorkstyleProfileCommand(current, {
      kind: 'initialize-from-onboarding',
      energy: 'low',
      cadence: '15/5',
      primaryFriction: 'distraction',
    });
    expect(initialized.ok).toBe(true);
    if (initialized.ok) {
      expect(initialized.value.preferredCadence).toBe('15/5');
      expect(initialized.value.energy).toBe('low');
      expect(initialized.value.momentum).toBe('steady');
      expect(initialized.value.friction.distraction).toBe('high');
      expect(initialized.value.assignedPetId).toBeNull();
      expect(initialized.value.onboardingCompleted).toBe(true);
    }
  });

  it('assigns a pet exactly once', () => {
    const current = createDefaultWorkstyleProfileValue();
    const assigned = applyWorkstyleProfileCommand(current, {
      kind: 'assign-pet',
      petId: 'theo',
    });
    expect(assigned.ok).toBe(true);

    const replaced = applyWorkstyleProfileCommand(assigned.ok ? assigned.value : current, {
      kind: 'assign-pet',
      petId: 'other',
    });
    expect(replaced).toMatchObject({
      ok: false,
      error: { kind: 'pet-already-assigned', existingPetId: 'theo' },
    });
  });

  it('returns caller-safe validation errors', () => {
    const current = createDefaultWorkstyleProfileValue();
    const invalid = applyWorkstyleProfileCommand(current, {
      kind: 'update-energy',
      energy: 'wired',
    });
    expect(invalid).toMatchObject({ ok: false, error: { kind: 'invalid-energy' } });
  });
});
