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
      expect(initialized.value.activePetId).toBeNull();
      expect(initialized.value.ownedPetIds).toEqual([]);
      expect(initialized.value.onboardingCompleted).toBe(true);
    }
  });

  it('adds pets to the collection and switches the active companion', () => {
    const current = createDefaultWorkstyleProfileValue();
    const first = applyWorkstyleProfileCommand(current, {
      kind: 'assign-pet',
      petId: 'pet-flux',
    });
    expect(first.ok).toBe(true);
    if (!first.ok) {
      return;
    }
    expect(first.value.activePetId).toBe('pet-flux');
    expect(first.value.ownedPetIds).toEqual(['pet-flux']);

    const second = applyWorkstyleProfileCommand(first.value, {
      kind: 'assign-pet',
      petId: 'pet-tide',
    });
    expect(second.ok).toBe(true);
    if (second.ok) {
      expect(second.value.activePetId).toBe('pet-tide');
      expect(second.value.ownedPetIds).toEqual(['pet-flux', 'pet-tide']);
    }
  });

  it('assigns the quiz pet and updates the active companion on retake', () => {
    const onboarded = applyWorkstyleProfileCommand(createDefaultWorkstyleProfileValue(), {
      kind: 'initialize-from-onboarding',
      energy: 'steady',
      cadence: '25/5',
      primaryFriction: 'motivation',
    });
    expect(onboarded.ok).toBe(true);
    if (!onboarded.ok) {
      return;
    }

    const completed = applyWorkstyleProfileCommand(onboarded.value, {
      kind: 'complete-personalization-quiz',
      outcome: { kind: 'top-two', dimensions: ['motivation', 'distraction'] },
    });
    expect(completed.ok).toBe(true);
    if (completed.ok) {
      expect(completed.value.personalizationQuizOutcome).toEqual({
        kind: 'top-two',
        dimensions: ['distraction', 'motivation'],
      });
      expect(completed.value.activePetId).toBe('pet-flux');
      expect(completed.value.ownedPetIds).toEqual(['pet-flux']);
    }

    const retake = applyWorkstyleProfileCommand(completed.ok ? completed.value : onboarded.value, {
      kind: 'complete-personalization-quiz',
      outcome: { kind: 'balanced' },
    });
    expect(retake.ok).toBe(true);
    if (retake.ok) {
      expect(retake.value.activePetId).toBe('pet-tide');
      expect(retake.value.ownedPetIds).toEqual(['pet-flux', 'pet-tide']);
      expect(retake.value.personalizationQuizOutcome).toEqual({ kind: 'balanced' });
    }
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
