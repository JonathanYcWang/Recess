import { describe, expect, it } from 'vitest';
import { applyPetMoodEvent, RESTLESS_TIME_OUT_MINUTES } from './decide';
import { createDefaultPetMoodValue } from './petMoodDocument';

const apply = (
  mood: ReturnType<typeof createDefaultPetMoodValue>,
  event: Parameters<typeof applyPetMoodEvent>[1]
) => {
  const result = applyPetMoodEvent(mood, event);
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error('expected pet mood event to apply');
  }
  return result.value;
};

describe('applyPetMoodEvent', () => {
  it('triggers Restless after ten minutes in Time Out and recovers on resume', () => {
    let mood = createDefaultPetMoodValue();
    mood = apply(mood, { kind: 'time-out-started', sessionId: 's1' });
    mood = apply(mood, {
      kind: 'time-out-elapsed',
      sessionId: 's1',
      elapsedMinutes: RESTLESS_TIME_OUT_MINUTES,
    });
    expect(mood.currentMood).toBe('restless');

    mood = apply(mood, { kind: 'time-out-resumed' });
    expect(mood.currentMood).toBe('happy');
  });

  it('triggers Hungry every third completed Focus Block and recovers on a later block', () => {
    let mood = createDefaultPetMoodValue();
    for (let i = 0; i < 3; i += 1) {
      mood = apply(mood, { kind: 'focus-block-completed' });
    }
    expect(mood.currentMood).toBe('hungry');
    mood = apply(mood, { kind: 'focus-block-completed' });
    expect(mood.currentMood).toBe('happy');
  });

  it('handles Sleepy check-in and Recess recovery', () => {
    let mood = createDefaultPetMoodValue();
    mood = apply(mood, { kind: 'low-energy-recess-check-in' });
    expect(mood.currentMood).toBe('sleepy');
    mood = apply(mood, { kind: 'recess-completed' });
    expect(mood.currentMood).toBe('happy');
  });

  it('handles Sad from missed reminders and recovery on completed Work Session', () => {
    let mood = createDefaultPetMoodValue();
    mood = apply(mood, { kind: 'reminder-missed' });
    expect(mood.currentMood).toBe('sad');
    mood = apply(mood, { kind: 'work-session-completed' });
    expect(mood.currentMood).toBe('happy');
  });

  it('transitions Happy to Calm at a trigger-free lifecycle boundary', () => {
    let mood = createDefaultPetMoodValue();
    mood = apply(mood, { kind: 'time-out-started', sessionId: 's1' });
    mood = apply(mood, {
      kind: 'time-out-elapsed',
      sessionId: 's1',
      elapsedMinutes: RESTLESS_TIME_OUT_MINUTES,
    });
    mood = apply(mood, { kind: 'time-out-resumed' });
    expect(mood.currentMood).toBe('happy');
    mood = apply(mood, { kind: 'lifecycle-boundary' });
    expect(mood.currentMood).toBe('calm');
  });

  it('lets a new trigger win over recovery at the same boundary', () => {
    let mood = createDefaultPetMoodValue();
    mood = apply(mood, { kind: 'reminder-missed' });
    mood = apply(mood, { kind: 'low-energy-recess-check-in' });
    expect(mood.currentMood).toBe('sleepy');
  });
});
