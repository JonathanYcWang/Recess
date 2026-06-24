import { describe, expect, it } from 'vitest';
import { applyWorkRhythmCommand } from './decide';
import {
  createDefaultWorkRhythmValue,
  DEFAULT_WORK_SESSION_GOAL_SECONDS,
  WORK_SESSION_GOAL_MAX_SECONDS,
  WORK_SESSION_GOAL_MIN_SECONDS,
  WORK_SESSION_GOAL_STEP_SECONDS,
} from './workRhythmDocument';
import { projectWorkRhythmSnapshot } from './snapshot';

const baseContext = {
  nowEpochMs: 1_700_000_000_000,
  sessionId: 'ws-test-1',
  preferredCadence: '25/5' as const,
  selectedTaskRemainingMinutes: null,
  gameBudget: { kind: 'cards' as const },
};

describe('applyWorkRhythmCommand', () => {
  it('accepts goals from 15 minutes through 8 hours in 15-minute steps', () => {
    for (
      let seconds = WORK_SESSION_GOAL_MIN_SECONDS;
      seconds <= WORK_SESSION_GOAL_MAX_SECONDS;
      seconds += WORK_SESSION_GOAL_STEP_SECONDS
    ) {
      const result = applyWorkRhythmCommand(
        createDefaultWorkRhythmValue(),
        { kind: 'start-work-session', goalSeconds: seconds, energy: 'steady' },
        baseContext
      );
      expect(result.ok).toBe(true);
      if (!result.ok || result.value.phase !== 'focus-block') {
        throw new Error('expected focus block');
      }
      expect(result.value.originalGoalSeconds).toBe(seconds);
    }
  });

  it('rejects goals outside the allowed range or step', () => {
    const invalidGoals = [
      WORK_SESSION_GOAL_MIN_SECONDS - WORK_SESSION_GOAL_STEP_SECONDS,
      WORK_SESSION_GOAL_MAX_SECONDS + WORK_SESSION_GOAL_STEP_SECONDS,
      WORK_SESSION_GOAL_MIN_SECONDS + 60,
      'three hours',
    ];
    for (const goalSeconds of invalidGoals) {
      const result = applyWorkRhythmCommand(
        createDefaultWorkRhythmValue(),
        { kind: 'start-work-session', goalSeconds, energy: 'steady' },
        baseContext
      );
      expect(result).toMatchObject({ ok: false, error: { kind: 'invalid-goal' } });
    }
  });

  it('defaults are documented at three hours for callers', () => {
    expect(DEFAULT_WORK_SESSION_GOAL_SECONDS).toBe(3 * 60 * 60);
  });

  it('requires energy and initializes momentum to steady for a new session', () => {
    const result = applyWorkRhythmCommand(
      createDefaultWorkRhythmValue(),
      {
        kind: 'start-work-session',
        goalSeconds: DEFAULT_WORK_SESSION_GOAL_SECONDS,
        energy: 'high',
      },
      baseContext
    );
    expect(result.ok).toBe(true);
    if (!result.ok || result.value.phase !== 'focus-block') {
      throw new Error('expected focus block');
    }
    expect(result.value.energy).toBe('high');
    expect(result.value.momentum).toBe('steady');
    expect(result.value.focusBlockStreak).toBe(0);
  });

  it('rejects invalid energy and active sessions', () => {
    const invalidEnergy = applyWorkRhythmCommand(
      createDefaultWorkRhythmValue(),
      {
        kind: 'start-work-session',
        goalSeconds: DEFAULT_WORK_SESSION_GOAL_SECONDS,
        energy: 'wired',
      },
      baseContext
    );
    expect(invalidEnergy).toMatchObject({ ok: false, error: { kind: 'invalid-energy' } });

    const started = applyWorkRhythmCommand(
      createDefaultWorkRhythmValue(),
      {
        kind: 'start-work-session',
        goalSeconds: DEFAULT_WORK_SESSION_GOAL_SECONDS,
        energy: 'steady',
      },
      baseContext
    );
    if (!started.ok) {
      throw new Error('expected start to succeed');
    }
    const duplicate = applyWorkRhythmCommand(
      started.value,
      {
        kind: 'start-work-session',
        goalSeconds: DEFAULT_WORK_SESSION_GOAL_SECONDS,
        energy: 'steady',
      },
      baseContext
    );
    expect(duplicate).toMatchObject({ ok: false, error: { kind: 'session-already-active' } });
  });

  it('invokes Scheduler with profile cadence, exact remaining goal, and task context', () => {
    const result = applyWorkRhythmCommand(
      createDefaultWorkRhythmValue(),
      {
        kind: 'start-work-session',
        goalSeconds: 60 * 60,
        energy: 'low',
      },
      {
        ...baseContext,
        preferredCadence: '45/10',
        selectedTaskRemainingMinutes: 20,
      }
    );
    expect(result.ok).toBe(true);
    if (!result.ok || result.value.phase !== 'focus-block') {
      throw new Error('expected focus block');
    }
    expect(result.value.schedulerReasons.map((reason) => reason.code)).toEqual(
      expect.arrayContaining(['base-cadence', 'energy-low', 'task-cap'])
    );
    expect(result.value.focusDurationSeconds).toBe(20 * 60);
  });

  it('commits durable anchors for session identity, goal, phase, and focus deadline', () => {
    const result = applyWorkRhythmCommand(
      createDefaultWorkRhythmValue(),
      {
        kind: 'start-work-session',
        goalSeconds: DEFAULT_WORK_SESSION_GOAL_SECONDS,
        energy: 'steady',
      },
      baseContext
    );
    expect(result.ok).toBe(true);
    if (!result.ok || result.value.phase !== 'focus-block') {
      throw new Error('expected focus block');
    }
    expect(result.value).toMatchObject({
      phase: 'focus-block',
      sessionId: 'ws-test-1',
      originalGoalSeconds: DEFAULT_WORK_SESSION_GOAL_SECONDS,
      sessionStartedAtEpochMs: baseContext.nowEpochMs,
      settledRemainingWorkSessionSeconds: DEFAULT_WORK_SESSION_GOAL_SECONDS,
      focusDeadlineAtEpochMs: baseContext.nowEpochMs + result.value.focusDurationSeconds * 1000,
    });
  });
});

describe('projectWorkRhythmSnapshot', () => {
  it('projects caller-safe remaining values from durable anchors without wall-clock coupling in decide', () => {
    const decided = applyWorkRhythmCommand(
      createDefaultWorkRhythmValue(),
      {
        kind: 'start-work-session',
        goalSeconds: 60 * 60,
        energy: 'steady',
      },
      baseContext
    );
    if (!decided.ok || decided.value.phase !== 'focus-block') {
      throw new Error('expected focus block');
    }

    const atStart = projectWorkRhythmSnapshot(decided.value, baseContext.nowEpochMs);
    expect(atStart).toMatchObject({
      phase: 'focus-block',
      remainingFocusSeconds: decided.value.focusDurationSeconds,
      remainingWorkSessionSeconds: 60 * 60,
      schedulerReasonCodes: decided.value.schedulerReasons.map((reason) => reason.code),
    });

    const afterFiveMinutes = projectWorkRhythmSnapshot(
      decided.value,
      baseContext.nowEpochMs + 5 * 60 * 1000
    );
    if (afterFiveMinutes.phase !== 'focus-block') {
      throw new Error('expected focus block snapshot');
    }
    expect(afterFiveMinutes.remainingFocusSeconds).toBe(
      decided.value.focusDurationSeconds - 5 * 60
    );
    expect(afterFiveMinutes.remainingWorkSessionSeconds).toBe(60 * 60 - 5 * 60);
    expect(afterFiveMinutes.windDownActive).toBe(false);

    const duringWindDown = projectWorkRhythmSnapshot(
      decided.value,
      decided.value.focusDeadlineAtEpochMs - 60 * 1000
    );
    if (duringWindDown.phase !== 'focus-block') {
      throw new Error('expected focus block snapshot');
    }
    expect(duringWindDown.windDownActive).toBe(true);
  });
});
