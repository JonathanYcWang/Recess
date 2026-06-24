import { describe, expect, it } from 'vitest';
import { lowerMomentumOneStep } from './momentum';
import { decideResumeFromTimeOut } from './resumeFromTimeOut';
import { decideStartTimeOut } from './startTimeOut';
import { advanceTimeOutBoundaries } from './timeOutReporting';
import type { WorkRhythmFocusBlock, WorkRhythmTimeOut } from './workRhythmDocument';
import { createDefaultWorkRhythmValue } from './workRhythmDocument';

const baseFocus = (overrides: Partial<WorkRhythmFocusBlock> = {}): WorkRhythmFocusBlock => ({
  phase: 'focus-block',
  sessionId: 'ws-1',
  originalGoalSeconds: 60 * 60,
  sessionStartedAtEpochMs: 1_000_000,
  remainingWorkSessionSeconds: 60 * 60,
  settledRemainingWorkSessionSeconds: 60 * 60,
  energy: 'steady',
  momentum: 'flowing',
  focusBlockIndex: 0,
  focusBlockStartedAtEpochMs: 1_000_000,
  focusDeadlineAtEpochMs: 1_000_000 + 25 * 60 * 1000,
  focusDurationSeconds: 25 * 60,
  isFinalFocus: false,
  wasExtension: false,
  schedulerReasons: [{ code: 'base-cadence', focusDeltaMinutes: 25, recessDeltaMinutes: 5 }],
  focusBlockStreak: 0,
  settlementSegment: 0,
  ...overrides,
});

const baseTimeOut = (overrides: Partial<WorkRhythmTimeOut> = {}): WorkRhythmTimeOut => ({
  phase: 'time-out',
  sessionId: 'ws-1',
  originalGoalSeconds: 60 * 60,
  settledRemainingWorkSessionSeconds: 50 * 60,
  settledRemainingFocusSeconds: 15 * 60,
  energy: 'steady',
  momentum: 'flowing',
  focusBlockIndex: 0,
  focusDurationSeconds: 25 * 60,
  isFinalFocus: false,
  wasExtension: false,
  schedulerReasons: [{ code: 'base-cadence', focusDeltaMinutes: 25, recessDeltaMinutes: 5 }],
  focusBlockStreak: 0,
  settlementSegment: 0,
  timeOutStartedAtEpochMs: 2_000_000,
  lastReportedFiveMinuteBoundary: 0,
  momentumLoweredDuringTimeOut: false,
  ...overrides,
});

describe('time out domain', () => {
  it('starts time out by settling elapsed focus and freezing remaining values', () => {
    const focus = baseFocus();
    const now = focus.focusBlockStartedAtEpochMs + 10 * 60 * 1000;
    const started = decideStartTimeOut(focus, now);
    expect(started.ok).toBe(true);
    if (!started.ok) {
      return;
    }
    expect(started.value.nextValue).toMatchObject({
      phase: 'time-out',
      settledRemainingWorkSessionSeconds: 50 * 60,
      settledRemainingFocusSeconds: 15 * 60,
      momentum: 'flowing',
      lastReportedFiveMinuteBoundary: 0,
    });
  });

  it('rejects illegal time out starts', () => {
    expect(decideStartTimeOut(createDefaultWorkRhythmValue(), 1)).toMatchObject({
      ok: false,
      error: { kind: 'invalid-phase-for-time-out' },
    });
    expect(decideStartTimeOut(baseTimeOut(), 1)).toMatchObject({
      ok: false,
      error: { kind: 'already-in-time-out' },
    });
  });

  it('resumes from time out with fresh anchors that preserve settled remaining values', () => {
    const timeOut = baseTimeOut();
    const resumeAt = 3_000_000;
    const resumed = decideResumeFromTimeOut(timeOut, resumeAt);
    expect(resumed.ok).toBe(true);
    if (!resumed.ok) {
      return;
    }
    expect(resumed.value.nextValue).toMatchObject({
      phase: 'focus-block',
      sessionStartedAtEpochMs: resumeAt,
      focusBlockStartedAtEpochMs: resumeAt,
      focusDeadlineAtEpochMs: resumeAt + 15 * 60 * 1000,
      focusDurationSeconds: 15 * 60,
      settledRemainingWorkSessionSeconds: 50 * 60,
      remainingWorkSessionSeconds: 50 * 60,
      momentum: 'flowing',
    });
  });

  it('reports five-minute boundaries and lowers momentum once at ten minutes', () => {
    const timeOut = baseTimeOut({ momentum: 'flowing' });
    const atFive = timeOut.timeOutStartedAtEpochMs + 5 * 60 * 1000;
    const five = advanceTimeOutBoundaries(timeOut, atFive);
    expect(five.events).toHaveLength(1);
    expect(five.events[0]?.elapsedMinutes).toBe(5);
    expect(five.nextValue.momentum).toBe('flowing');
    expect(five.nextValue.momentumLoweredDuringTimeOut).toBe(false);

    const atTen = timeOut.timeOutStartedAtEpochMs + 10 * 60 * 1000;
    const ten = advanceTimeOutBoundaries(timeOut, atTen);
    expect(ten.events).toHaveLength(2);
    expect(ten.nextValue.momentum).toBe('building');
    expect(ten.nextValue.momentumLoweredDuringTimeOut).toBe(true);
    expect(ten.nextValue.lastReportedFiveMinuteBoundary).toBe(2);

    const replay = advanceTimeOutBoundaries(ten.nextValue, atTen + 60_000);
    expect(replay.events).toHaveLength(0);
  });

  it('lowers momentum one qualitative step at a time', () => {
    expect(lowerMomentumOneStep('flowing')).toBe('building');
    expect(lowerMomentumOneStep('building')).toBe('steady');
    expect(lowerMomentumOneStep('steady')).toBe('low');
    expect(lowerMomentumOneStep('low')).toBe('low');
  });
});
