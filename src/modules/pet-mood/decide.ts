import type { Result } from '@/modules/persisted-application-state/types';
import { clonePetMoodValue, type PetMoodState, type PetMoodValue } from './petMoodDocument';

export const RESTLESS_TIME_OUT_MINUTES = 10;
export const HUNGRY_FOCUS_BLOCK_INTERVAL = 3;

export type PetMoodEvent =
  | { kind: 'time-out-started'; sessionId: string }
  | { kind: 'time-out-elapsed'; sessionId: string; elapsedMinutes: number }
  | { kind: 'time-out-resumed' }
  | { kind: 'focus-block-started' }
  | { kind: 'focus-block-completed' }
  | { kind: 'recess-completed' }
  | { kind: 'work-session-completed' }
  | { kind: 'work-session-incomplete' }
  | { kind: 'reminder-missed' }
  | { kind: 'low-energy-recess-check-in' }
  | { kind: 'lifecycle-boundary' }
  | { kind: 'mood-boost-applied' };

const setMood = (value: PetMoodValue, mood: PetMoodState): PetMoodValue => ({
  ...value,
  currentMood: mood,
});

const applyTrigger = (value: PetMoodValue, mood: PetMoodState): PetMoodValue =>
  setMood(clonePetMoodValue(value), mood);

const applyRecoveryToHappy = (value: PetMoodValue): PetMoodValue => setMood(value, 'happy');

export const applyPetMoodEvent = (
  current: PetMoodValue,
  event: PetMoodEvent
): Result<PetMoodValue, never> => {
  const next = clonePetMoodValue(current);

  switch (event.kind) {
    case 'time-out-started':
      next.timeOutSessionId = event.sessionId;
      next.timeOutElapsedMinutes = 0;
      return { ok: true, value: next };
    case 'time-out-elapsed': {
      if (next.timeOutSessionId !== event.sessionId) {
        return { ok: true, value: next };
      }
      next.timeOutElapsedMinutes = event.elapsedMinutes;
      if (event.elapsedMinutes >= RESTLESS_TIME_OUT_MINUTES) {
        return { ok: true, value: applyTrigger(next, 'restless') };
      }
      return { ok: true, value: next };
    }
    case 'time-out-resumed':
      next.timeOutSessionId = null;
      next.timeOutElapsedMinutes = 0;
      if (next.currentMood === 'restless') {
        return { ok: true, value: applyRecoveryToHappy(next) };
      }
      return { ok: true, value: next };
    case 'focus-block-started':
      if (next.currentMood === 'restless') {
        return { ok: true, value: applyRecoveryToHappy(next) };
      }
      return { ok: true, value: next };
    case 'focus-block-completed': {
      next.completedFocusBlocksInSession += 1;
      if (next.currentMood === 'hungry') {
        return { ok: true, value: applyRecoveryToHappy(next) };
      }
      if (next.completedFocusBlocksInSession % HUNGRY_FOCUS_BLOCK_INTERVAL === 0) {
        return { ok: true, value: applyTrigger(next, 'hungry') };
      }
      return { ok: true, value: next };
    }
    case 'low-energy-recess-check-in':
      return { ok: true, value: applyTrigger(next, 'sleepy') };
    case 'recess-completed':
      if (next.currentMood === 'sleepy') {
        return { ok: true, value: applyRecoveryToHappy(next) };
      }
      return { ok: true, value: next };
    case 'work-session-incomplete':
    case 'reminder-missed':
      return { ok: true, value: applyTrigger(next, 'sad') };
    case 'work-session-completed':
      next.completedFocusBlocksInSession = 0;
      next.timeOutSessionId = null;
      next.timeOutElapsedMinutes = 0;
      if (next.currentMood === 'sad') {
        return { ok: true, value: applyRecoveryToHappy(next) };
      }
      return { ok: true, value: next };
    case 'lifecycle-boundary':
      if (next.currentMood === 'happy') {
        return { ok: true, value: setMood(next, 'calm') };
      }
      return { ok: true, value: next };
    case 'mood-boost-applied':
      return { ok: true, value: applyTrigger(next, 'happy') };
  }
};
