import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_REROLLS,
  DEFAULT_WORK_SESSION_DURATION,
  FOCUS_COUNTDOWN_DURATION,
  SESSION_STATES,
} from '../../constants/constants';
import type { Reward } from '../../types/reward';
import {
  endSessionEarly,
  endWorkSessionEarly,
  pauseSession,
  rerollReward,
  resumeSession,
  selectReward,
  setGeneratedRewards,
  setShownRewardCombinations,
  setTotalTimer,
  startFocusSession,
  transitionToBeforeWorkSession,
  transitionToFocusSessionCountdown,
  transitionToRewardSelection,
  updateFeedbackMultiplier,
  updateTimerState,
} from '../actions/timerActions';
import timerReducer from './timerReducer';

const reward: Reward = {
  id: 'youtube',
  name: 'YouTube',
  duration: 300,
};

const alternateReward: Reward = {
  id: 'reddit',
  name: 'Reddit',
  duration: 600,
};

describe('timerReducer', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts before a work session with derived focus duration', () => {
    const state = timerReducer(undefined, { type: 'test/init' });

    expect(state.sessionState).toBe(SESSION_STATES.BEFORE_WORK_SESSION);
    expect(state.totalTimer).toBe(DEFAULT_WORK_SESSION_DURATION);
    expect(state.totalRemaining).toBe(DEFAULT_WORK_SESSION_DURATION);
    expect(state.currentTimer).toBeGreaterThan(0);
    expect(state.currentTimerRemaining).toBe(state.currentTimer);
    expect(state.rerolls).toBe(DEFAULT_REROLLS);
  });

  it('updates partial timer state', () => {
    const state = timerReducer(
      undefined,
      updateTimerState({
        totalRemaining: 42,
        isPaused: true,
      })
    );

    expect(state.totalRemaining).toBe(42);
    expect(state.isPaused).toBe(true);
  });

  it('sets total timer and recalculates current duration before work starts', () => {
    const state = timerReducer(undefined, setTotalTimer(3600));

    expect(state.totalTimer).toBe(3600);
    expect(state.totalRemaining).toBe(3600);
    expect(state.currentTimerRemaining).toBe(state.currentTimer);
  });

  it('starts, pauses, and resumes focus sessions with stable timer invariants', () => {
    vi.spyOn(Date, 'now').mockReturnValueOnce(1000).mockReturnValueOnce(2000);

    const started = timerReducer(undefined, startFocusSession());
    const paused = timerReducer(started, pauseSession(123));
    const secondPause = timerReducer(paused, pauseSession(50));
    const resumed = timerReducer(secondPause, resumeSession());

    expect(started.sessionState).toBe(SESSION_STATES.ONGOING_FOCUS_SESSION);
    expect(started.currentStartTime).toBe(1000);
    expect(paused.isPaused).toBe(true);
    expect(paused.currentTimer).toBe(started.currentTimer);
    expect(paused.currentTimerRemaining).toBe(123);
    expect(paused.currentStartTime).toBeUndefined();
    expect(secondPause.currentTimerRemaining).toBe(123);
    expect(resumed.isPaused).toBe(false);
    expect(resumed.currentStartTime).toBe(2000);
  });

  it('ignores pause and resume outside an ongoing focus session', () => {
    const initial = timerReducer(undefined, { type: 'test/init' });
    const paused = timerReducer(initial, pauseSession(100));
    const resumed = timerReducer(initial, resumeSession());

    expect(paused).toEqual(initial);
    expect(resumed).toEqual(initial);
  });

  it('transitions from a break to focus countdown when ending a break early', () => {
    vi.spyOn(Date, 'now')
      .mockReturnValueOnce(1000)
      .mockReturnValueOnce(1500)
      .mockReturnValueOnce(2000);

    const breakState = timerReducer(
      timerReducer(undefined, startFocusSession()),
      selectReward(reward)
    );
    const countdown = timerReducer(breakState, endSessionEarly());

    expect(countdown.sessionState).toBe(SESSION_STATES.FOCUS_SESSION_COUNTDOWN);
    expect(countdown.currentTimer).toBe(FOCUS_COUNTDOWN_DURATION);
    expect(countdown.currentTimerRemaining).toBe(FOCUS_COUNTDOWN_DURATION);
    expect(countdown.currentStartTime).toBe(2000);
    expect(countdown.selectedReward).toEqual(reward);
  });

  it('ends a focus session early and moves to reward selection with elapsed work deducted', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1000);

    const started = timerReducer(undefined, startFocusSession());
    const paused = timerReducer(started, pauseSession(started.currentTimer - 60));
    const ended = timerReducer(paused, endSessionEarly());

    expect(ended.sessionState).toBe(SESSION_STATES.REWARD_SELECTION);
    expect(ended.lastFocusSessionCompleted).toBe(true);
    expect(ended.lastFocusSessionDuration).toBe(60);
    expect(ended.totalRemaining).toBe(DEFAULT_WORK_SESSION_DURATION - 60);
    expect(ended.currentStartTime).toBeUndefined();
    expect(ended.currentTimerRemaining).toBe(0);
  });

  it('ends a work session immediately', () => {
    const state = timerReducer(undefined, endWorkSessionEarly());

    expect(state.sessionState).toBe(SESSION_STATES.WORK_SESSION_COMPLETE);
    expect(state.totalRemaining).toBe(0);
    expect(state.currentTimer).toBe(0);
    expect(state.currentTimerRemaining).toBe(0);
    expect(state.selectedReward).toBeNull();
  });

  it('selects rewards and resets generated reward state', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1000);

    const withRewards = timerReducer(
      timerReducer(
        timerReducer(undefined, setGeneratedRewards([reward])),
        setShownRewardCombinations(['a,b'])
      ),
      selectReward(reward)
    );

    expect(withRewards.sessionState).toBe(SESSION_STATES.ONGOING_BREAK_SESSION);
    expect(withRewards.selectedReward).toEqual(reward);
    expect(withRewards.currentTimer).toBe(reward.duration);
    expect(withRewards.generatedRewards).toEqual([]);
    expect(withRewards.shownRewardCombinations).toEqual([]);
  });

  it('rerolls rewards only while rerolls remain', () => {
    const withRewards = timerReducer(undefined, setGeneratedRewards([reward]));
    const rerolled = timerReducer(withRewards, rerollReward({ index: 0, reward: alternateReward }));
    const exhausted = {
      ...rerolled,
      rerolls: 0,
      generatedRewards: [alternateReward],
    };
    const unchanged = timerReducer(exhausted, rerollReward({ index: 0, reward }));

    expect(rerolled.generatedRewards[0]).toEqual(alternateReward);
    expect(rerolled.rerolls).toBe(DEFAULT_REROLLS - 1);
    expect(unchanged.generatedRewards[0]).toEqual(alternateReward);
    expect(unchanged.rerolls).toBe(0);
  });

  it('transitions through countdown, reward selection, and back before work', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1000);

    const countdown = timerReducer(undefined, transitionToFocusSessionCountdown());
    const focus = timerReducer(countdown, startFocusSession());
    const rewardSelection = timerReducer(focus, transitionToRewardSelection());
    const beforeWork = timerReducer(rewardSelection, transitionToBeforeWorkSession());

    expect(countdown.sessionState).toBe(SESSION_STATES.FOCUS_SESSION_COUNTDOWN);
    expect(countdown.currentTimer).toBe(FOCUS_COUNTDOWN_DURATION);
    expect(rewardSelection.sessionState).toBe(SESSION_STATES.REWARD_SELECTION);
    expect(rewardSelection.totalRemaining).toBeLessThan(DEFAULT_WORK_SESSION_DURATION);
    expect(beforeWork.sessionState).toBe(SESSION_STATES.BEFORE_WORK_SESSION);
    expect(beforeWork.currentStartTime).toBeUndefined();
    expect(beforeWork.selectedReward).toBeNull();
  });

  it('updates feedback multiplier and recalculates upcoming focus duration before work starts', () => {
    const initial = timerReducer(undefined, { type: 'test/init' });
    const updated = timerReducer(initial, updateFeedbackMultiplier(1.5));

    expect(updated.feedbackMultiplier).toBe(1.5);
    expect(updated.currentTimerRemaining).toBe(initial.currentTimerRemaining);
    expect(updated.currentTimer).toBeGreaterThan(0);
  });
});
