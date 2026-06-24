import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SESSION_STATES } from '../constants/constants';
import type { RootState } from '../store';
import { setBlockedSites } from '../store/actions/blockedSitesActions';
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
  transitionToFocusSession,
  transitionToFocusSessionCountdown,
  transitionToRewardSelection,
  updateFeedbackMultiplier,
  updateTimerState,
} from '../store/actions/timerActions';
import blockedSitesReducer from '../store/reducers/blockedSitesReducer';
import blockListProjectionReducer from '../store/reducers/blockListProjectionReducer';
import quizReducer from '../store/reducers/quizReducer';
import routingReducer from '../store/reducers/routingReducer';
import settingsProjectionReducer from '../store/reducers/settingsProjectionReducer';
import timerReducer from '../store/reducers/timerReducer';
import workHoursReducer from '../store/reducers/workHoursReducer';
import type { Reward } from '../types/reward';
import { useTimer } from './useTimer';

const hookMocks = vi.hoisted(() => ({
  dispatch: vi.fn(),
  state: undefined as unknown,
  setTick: vi.fn(),
  effectCleanups: [] as Array<() => void>,
}));

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');

  return {
    ...actual,
    useCallback: <T extends (...args: never[]) => unknown>(callback: T) => callback,
    useEffect: (effect: () => void | (() => void)) => {
      const cleanup = effect();
      if (typeof cleanup === 'function') {
        hookMocks.effectCleanups.push(cleanup);
      }
    },
    useRef: <T>(initialValue: T) => ({ current: initialValue }),
    useState: () => [0, hookMocks.setTick],
  };
});

vi.mock('react-redux', () => ({
  useDispatch: () => hookMocks.dispatch,
  useSelector: (selector: (state: RootState) => unknown) => selector(hookMocks.state as RootState),
}));

vi.mock('../services/notificationService', () => ({
  notifyFocusEnding: vi.fn(),
  notifyFocusComplete: vi.fn(),
  notifyBreakEnding: vi.fn(),
  notifyBreakComplete: vi.fn(),
}));

vi.mock('../services/rewardService', () => ({
  generateReward: vi.fn(),
}));

const reward: Reward = {
  id: 'youtube.com-300',
  name: 'youtube.com',
  duration: 300,
};

const alternateReward: Reward = {
  id: 'reddit.com-600',
  name: 'reddit.com',
  duration: 600,
};

const createState = (overrides: Partial<RootState['timer']> = {}): RootState => ({
  timer: {
    ...timerReducer(undefined, { type: 'test/init' }),
    ...overrides,
  },
  workHours: workHoursReducer(undefined, { type: 'test/init' }),
  blockedSites: blockedSitesReducer(undefined, setBlockedSites(['youtube.com', 'reddit.com'])),
  routing: routingReducer(undefined, { type: 'test/init' }),
  quiz: quizReducer(undefined, { type: 'test/init' }),
  settingsProjection: settingsProjectionReducer(undefined, { type: 'test/init' }),
  blockListProjection: blockListProjectionReducer(undefined, { type: 'test/init' }),
});

const dispatchedTypes = () => hookMocks.dispatch.mock.calls.map(([action]) => action.type);

describe('useTimer', async () => {
  const notifications = await import('../services/notificationService');
  const rewardService = await import('../services/rewardService');
  const mockedGenerateReward = vi.mocked(rewardService.generateReward);

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(10_000);
    hookMocks.dispatch.mockClear();
    hookMocks.setTick.mockClear();
    hookMocks.effectCleanups = [];
    mockedGenerateReward.mockReset();
    hookMocks.state = createState();
  });

  afterEach(() => {
    for (const cleanup of hookMocks.effectCleanups) {
      cleanup();
    }
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('returns timer state and dispatches basic timer actions', () => {
    const result = useTimer();

    result.startFocusSession();
    result.pauseSession();
    result.resumeSession();
    result.endSessionEarly();
    result.endWorkSessionEarly();
    result.transitionToBeforeWorkSession();
    result.selectReward(reward);
    result.updateTimerState({ isPaused: true });
    result.setTotalTimer(1800);
    result.updateFeedbackMultiplier(1.25);

    expect(result.timerState).toBe((hookMocks.state as RootState).timer);
    expect(result.currentRemaining).toBe(
      (hookMocks.state as RootState).timer.currentTimerRemaining
    );
    expect(hookMocks.dispatch).toHaveBeenCalledWith(startFocusSession());
    expect(hookMocks.dispatch).toHaveBeenCalledWith(
      pauseSession((hookMocks.state as RootState).timer.currentTimerRemaining)
    );
    expect(hookMocks.dispatch).toHaveBeenCalledWith(resumeSession());
    expect(hookMocks.dispatch).toHaveBeenCalledWith(endSessionEarly());
    expect(hookMocks.dispatch).toHaveBeenCalledWith(endWorkSessionEarly());
    expect(hookMocks.dispatch).toHaveBeenCalledWith(transitionToBeforeWorkSession());
    expect(hookMocks.dispatch).toHaveBeenCalledWith(selectReward(reward));
    expect(hookMocks.dispatch).toHaveBeenCalledWith(updateTimerState({ isPaused: true }));
    expect(hookMocks.dispatch).toHaveBeenCalledWith(setTotalTimer(1800));
    expect(hookMocks.dispatch).toHaveBeenCalledWith(updateFeedbackMultiplier(1.25));
    expect(result.rewards).toEqual([]);
  });

  it('calculates live remaining time for an active focus session and pauses with that value', () => {
    hookMocks.state = createState({
      sessionState: SESSION_STATES.ONGOING_FOCUS_SESSION,
      isPaused: false,
      currentTimerRemaining: 600,
      currentStartTime: 7_000,
    });

    const result = useTimer();

    result.pauseSession();

    expect(result.currentRemaining).toBe(597);
    expect(hookMocks.dispatch).toHaveBeenCalledWith(pauseSession(597));
  });

  it('generates reward options when entering reward selection with blocked sites', () => {
    mockedGenerateReward
      .mockReturnValueOnce(reward)
      .mockReturnValueOnce(alternateReward)
      .mockReturnValueOnce({ id: 'news.example-900', name: 'news.example', duration: 900 });
    hookMocks.state = createState({
      sessionState: SESSION_STATES.REWARD_SELECTION,
      generatedRewards: [],
      shownRewardCombinations: ['existing-300'],
      fatigueScore: 20,
      momentumScore: 0.75,
    });

    useTimer();

    expect(mockedGenerateReward).toHaveBeenCalledTimes(3);
    expect(mockedGenerateReward).toHaveBeenCalledWith(
      ['youtube.com', 'reddit.com'],
      ['existing-300'],
      20,
      0.75
    );
    expect(hookMocks.dispatch).toHaveBeenCalledWith(
      setGeneratedRewards([
        reward,
        alternateReward,
        { id: 'news.example-900', name: 'news.example', duration: 900 },
      ])
    );
    expect(hookMocks.dispatch).toHaveBeenCalledWith(setShownRewardCombinations(['existing-300']));
  });

  it('rerolls a reward while rerolls remain and records the updated combinations', () => {
    mockedGenerateReward.mockImplementation((_sites, shownCombinations) => {
      shownCombinations.push('reddit.com-600');
      return alternateReward;
    });
    hookMocks.state = createState({
      rerolls: 2,
      shownRewardCombinations: ['youtube.com-300'],
      fatigueScore: 40,
      momentumScore: 0.25,
    });

    const result = useTimer();
    result.handleReroll(1);

    expect(hookMocks.dispatch).toHaveBeenCalledWith(
      rerollReward({ index: 1, reward: alternateReward })
    );
    expect(hookMocks.dispatch).toHaveBeenCalledWith(
      setShownRewardCombinations(['youtube.com-300', 'reddit.com-600'])
    );
  });

  it('does not reroll when no rerolls remain', () => {
    hookMocks.state = createState({ rerolls: 0 });

    const result = useTimer();
    result.handleReroll(0);

    expect(mockedGenerateReward).not.toHaveBeenCalled();
    expect(hookMocks.dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: rerollReward.type })
    );
  });

  it('transitions an already-expired focus session during render effects', () => {
    hookMocks.state = createState({
      sessionState: SESSION_STATES.ONGOING_FOCUS_SESSION,
      currentTimerRemaining: 0,
      currentStartTime: undefined,
    });

    useTimer();

    expect(notifications.notifyFocusComplete).toHaveBeenCalled();
    expect(hookMocks.setTick).toHaveBeenCalled();
    expect(hookMocks.dispatch).not.toHaveBeenCalledWith(transitionToRewardSelection());

    vi.advanceTimersByTime(1000);

    expect(hookMocks.dispatch).toHaveBeenCalledWith(transitionToRewardSelection());
  });

  it('uses interval ticks for active focus notifications and completion transition', () => {
    hookMocks.state = createState({
      sessionState: SESSION_STATES.ONGOING_FOCUS_SESSION,
      currentTimerRemaining: 301,
      currentStartTime: 10_000,
    });

    useTimer();
    vi.advanceTimersByTime(1000);
    vi.setSystemTime(311_000);
    vi.advanceTimersByTime(1000);

    expect(notifications.notifyFocusEnding).toHaveBeenCalledWith(5);
    expect(notifications.notifyFocusComplete).toHaveBeenCalled();
    expect(hookMocks.setTick).toHaveBeenCalled();
    expect(hookMocks.dispatch).not.toHaveBeenCalledWith(transitionToRewardSelection());

    vi.advanceTimersByTime(1000);

    expect(hookMocks.dispatch).toHaveBeenCalledWith(transitionToRewardSelection());
  });

  it('uses interval ticks for break completion and countdown completion transitions', () => {
    hookMocks.state = createState({
      sessionState: SESSION_STATES.ONGOING_BREAK_SESSION,
      currentTimerRemaining: 1,
      currentStartTime: 10_000,
    });

    useTimer();
    vi.setSystemTime(12_000);
    vi.advanceTimersByTime(1000);

    expect(notifications.notifyBreakComplete).toHaveBeenCalled();
    expect(hookMocks.dispatch).not.toHaveBeenCalledWith(transitionToFocusSessionCountdown());

    vi.advanceTimersByTime(1000);

    expect(hookMocks.dispatch).toHaveBeenCalledWith(transitionToFocusSessionCountdown());

    hookMocks.dispatch.mockClear();
    hookMocks.effectCleanups.forEach((cleanup) => cleanup());
    hookMocks.effectCleanups = [];
    vi.setSystemTime(10_000);
    hookMocks.state = createState({
      sessionState: SESSION_STATES.FOCUS_SESSION_COUNTDOWN,
      currentTimerRemaining: 1,
      currentStartTime: 10_000,
    });

    useTimer();
    vi.setSystemTime(12_000);
    vi.advanceTimersByTime(1000);

    expect(hookMocks.dispatch).not.toHaveBeenCalledWith(transitionToFocusSession());

    vi.advanceTimersByTime(1000);

    expect(hookMocks.dispatch).toHaveBeenCalledWith(transitionToFocusSession());
  });

  it('does not start interval ticks while paused', () => {
    hookMocks.state = createState({
      sessionState: SESSION_STATES.ONGOING_FOCUS_SESSION,
      isPaused: true,
      currentTimerRemaining: 0,
    });

    useTimer();
    vi.advanceTimersByTime(1000);

    expect(dispatchedTypes()).not.toContain(transitionToRewardSelection.type);
  });
});
