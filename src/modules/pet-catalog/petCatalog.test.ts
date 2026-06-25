import { describe, expect, it } from 'vitest';
import { FRICTION_DIMENSIONS } from '@/modules/workstyle-profile';
import { PET_MOODS, petCatalog, resolvePetIdFromQuizOutcome } from './index';
import { pairKeyFromDimensions } from './petCatalog';

describe('petCatalog', () => {
  it('defines sixteen pets with eight mood asset specs each', () => {
    expect(petCatalog.pets).toHaveLength(16);
    const ids = petCatalog.pets.map((pet) => pet.id);
    expect(new Set(ids).size).toBe(16);

    for (const pet of petCatalog.pets) {
      expect(pet.name.trim().length).toBeGreaterThan(0);
      expect(pet.personalityCopy.trim().length).toBeGreaterThan(0);
      for (const mood of PET_MOODS) {
        const asset = pet.moodAssets[mood];
        expect(asset.assetPath).toContain(pet.id);
        expect(asset.accessibleLabel.length).toBeGreaterThan(0);
        expect(asset.reducedMotionBehavior).toBe('show-static-frame');
      }
    }
  });

  it('maps every unordered friction pair and Balanced to one unique pet id', () => {
    const expectedPairs: string[] = [];
    for (let i = 0; i < FRICTION_DIMENSIONS.length; i += 1) {
      for (let j = i + 1; j < FRICTION_DIMENSIONS.length; j += 1) {
        expectedPairs.push(pairKeyFromDimensions(FRICTION_DIMENSIONS[i], FRICTION_DIMENSIONS[j]));
      }
    }
    expect(expectedPairs).toHaveLength(15);

    const assignedPetIds = new Set<string>();
    for (const pair of expectedPairs) {
      const petId = petCatalog.assignmentMap[pair];
      expect(petId).toBeDefined();
      assignedPetIds.add(petId);
    }
    expect(petCatalog.assignmentMap.balanced).toBe('pet-tide');
    assignedPetIds.add(petCatalog.assignmentMap.balanced);
    expect(assignedPetIds.size).toBe(16);
  });

  it('resolves quiz outcomes deterministically through the assignment map', () => {
    const topTwo = resolvePetIdFromQuizOutcome({
      kind: 'top-two',
      dimensions: ['motivation', 'distraction'],
    });
    expect(topTwo).toBe('pet-flux');

    const balanced = resolvePetIdFromQuizOutcome({ kind: 'balanced' });
    expect(balanced).toBe('pet-tide');
  });

  it('avoids punitive or diagnostic language in pet copy', () => {
    const forbidden = ['mbti', 'personality type', 'lazy', 'failure', 'disappear', 'die'];
    for (const pet of petCatalog.pets) {
      const copy = `${pet.name} ${pet.personalityCopy}`.toLowerCase();
      for (const term of forbidden) {
        expect(copy.includes(term)).toBe(false);
      }
    }
  });
});
