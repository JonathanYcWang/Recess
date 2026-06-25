export const PET_CATALOG_VERSION = 1 as const;

export const PET_MOODS = [
  'calm',
  'focused',
  'curious',
  'happy',
  'restless',
  'hungry',
  'sleepy',
  'sad',
] as const;

export type PetMood = (typeof PET_MOODS)[number];

export interface PetMoodAssetSpec {
  mood: PetMood;
  assetPath: string;
  accessibleLabel: string;
  presentationRole: 'img';
  reducedMotionBehavior: 'show-static-frame';
}

export interface PetDefinition {
  id: string;
  name: string;
  personalityCopy: string;
  moodAssets: Record<PetMood, PetMoodAssetSpec>;
}

export type PetAssignmentKey = { kind: 'balanced' } | { kind: 'top-two'; pairKey: string };

export interface PetCatalog {
  version: typeof PET_CATALOG_VERSION;
  pets: readonly PetDefinition[];
  assignmentMap: Record<string, string>;
}

export const createPetMoodAssets = (
  petId: string,
  petName: string
): Record<PetMood, PetMoodAssetSpec> => {
  const labels: Record<PetMood, string> = {
    calm: `${petName} resting quietly beside you`,
    focused: `${petName} working steadily alongside you`,
    curious: `${petName} looking interested in what you are doing`,
    happy: `${petName} pleased after a good stretch of progress`,
    restless: `${petName} ready to move after a long pause`,
    hungry: `${petName} hoping for a small break snack ritual`,
    sleepy: `${petName} low-energy after a draining check-in`,
    sad: `${petName} subdued after a missed session or reminder`,
  };

  return PET_MOODS.reduce(
    (assets, mood) => {
      assets[mood] = {
        mood,
        assetPath: `/assets/pets/${petId}/${mood}.png`,
        accessibleLabel: labels[mood],
        presentationRole: 'img',
        reducedMotionBehavior: 'show-static-frame',
      };
      return assets;
    },
    {} as Record<PetMood, PetMoodAssetSpec>
  );
};
