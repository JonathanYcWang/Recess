import type { PetMood } from '@/modules/pet-catalog';

export const PET_MOOD_STATES = [
  'calm',
  'focused',
  'curious',
  'happy',
  'restless',
  'hungry',
  'sleepy',
  'sad',
] as const satisfies readonly PetMood[];

export type PetMoodState = (typeof PET_MOOD_STATES)[number];

export interface PetMoodValue {
  currentMood: PetMoodState;
  completedFocusBlocksInSession: number;
  timeOutSessionId: string | null;
  timeOutElapsedMinutes: number;
}

export const createDefaultPetMoodValue = (): PetMoodValue => ({
  currentMood: 'calm',
  completedFocusBlocksInSession: 0,
  timeOutSessionId: null,
  timeOutElapsedMinutes: 0,
});

export const clonePetMoodValue = (value: PetMoodValue): PetMoodValue => ({
  currentMood: value.currentMood,
  completedFocusBlocksInSession: value.completedFocusBlocksInSession,
  timeOutSessionId: value.timeOutSessionId,
  timeOutElapsedMinutes: value.timeOutElapsedMinutes,
});
