import { describe, expect, it } from 'vitest';
import { PHASE_DURATION, SCHEDULER_PHASE } from '@/Shared/Constants/Constants';
import type { SchedulerState } from '@/Shared/Types/AppState';
import {
  computePhaseEndTime,
  createDefaultSchedulerState,
  evaluateScheduler,
  pauseScheduler,
  resumeScheduler,
  startWorkSession,
} from '@/Background/Services/Scheduler/SchedulerService';

const start = new Date('2026-01-01T12:00:00.000Z');

const focusState = (): SchedulerState => startWorkSession(start);

describe('pauseScheduler', () => {
  it('freezes leftover focus and session time from FOCUS_BLOCK', () => {
    const now = new Date(start.getTime() + 5 * 60 * 1000);
    const paused = pauseScheduler(focusState(), now);
    const originalDuration = PHASE_DURATION.FOCUS_BLOCK;

    expect(paused.activePhase).toBe(SCHEDULER_PHASE.PAUSE);
    expect(paused.phaseStart).toBe(now.toISOString());
    expect(paused.phaseRemaining).toBe(originalDuration - 5 * 60);
    expect(paused.phaseTarget).toBe(originalDuration);
    expect(paused.workSessionRemaining).toBe(paused.workSessionTarget - 5 * 60);
  });

  it('is a no-op outside FOCUS_BLOCK', () => {
    const idle = createDefaultSchedulerState();
    expect(pauseScheduler(idle, start)).toBe(idle);

    const paused = pauseScheduler(focusState(), start);
    expect(pauseScheduler(paused, start)).toBe(paused);
  });
});

describe('resumeScheduler', () => {
  it('returns to FOCUS_BLOCK with leftover phaseRemaining', () => {
    const pauseAt = new Date(start.getTime() + 5 * 60 * 1000);
    const resumeAt = new Date(pauseAt.getTime() + 3 * 60 * 1000);
    const paused = pauseScheduler(focusState(), pauseAt);
    const resumed = resumeScheduler(paused, resumeAt);

    expect(resumed.activePhase).toBe(SCHEDULER_PHASE.FOCUS_BLOCK);
    expect(resumed.phaseStart).toBe(resumeAt.toISOString());
    expect(resumed.phaseRemaining).toBe(paused.phaseRemaining);
    expect(resumed.workSessionRemaining).toBe(paused.workSessionRemaining);
    expect(resumed.phaseTarget).toBe(PHASE_DURATION.FOCUS_BLOCK);
  });

  it('is a no-op when not paused', () => {
    const focus = focusState();
    expect(resumeScheduler(focus, start)).toBe(focus);
  });
});

describe('evaluateScheduler', () => {
  it('does not advance or decrement session while paused', () => {
    const pauseAt = new Date(start.getTime() + 5 * 60 * 1000);
    const later = new Date(pauseAt.getTime() + 30 * 60 * 1000);
    const paused = pauseScheduler(focusState(), pauseAt);

    expect(evaluateScheduler(paused, later)).toEqual(paused);
  });

  it('advances FOCUS_BLOCK when elapsed reaches phaseRemaining', () => {
    const next = evaluateScheduler(
      focusState(),
      new Date(start.getTime() + PHASE_DURATION.FOCUS_BLOCK * 1000)
    );

    expect(next.activePhase).toBe(SCHEDULER_PHASE.REWARD_GAME);
  });

  it('does not advance FOCUS_BLOCK before phaseRemaining elapses', () => {
    const focus = focusState();
    expect(evaluateScheduler(focus, new Date(start.getTime() + 60 * 1000))).toEqual(focus);
  });
});

describe('computePhaseEndTime', () => {
  it('is null while paused', () => {
    const paused = pauseScheduler(focusState(), start);
    expect(computePhaseEndTime(paused)).toBeNull();
  });

  it('uses phaseRemaining from phaseStart', () => {
    const focus = focusState();
    expect(computePhaseEndTime(focus)).toEqual(
      new Date(start.getTime() + focus.phaseRemaining * 1000)
    );
  });
});
