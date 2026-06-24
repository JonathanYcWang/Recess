import { describe, expect, it } from 'vitest';
import { SESSION_STATES } from '../../constants/constants';
import blockedSitesReducer from '../reducers/blockedSitesReducer';
import quizReducer from '../reducers/quizReducer';
import routingReducer from '../reducers/routingReducer';
import settingsProjectionReducer from '../reducers/settingsProjectionReducer';
import timerReducer from '../reducers/timerReducer';
import workHoursReducer from '../reducers/workHoursReducer';
import type { RootState } from '../index';
import { addBlockedSite } from '../actions/blockedSitesActions';
import { selectOption } from '../actions/quizActions';
import { completeOnboarding } from '../actions/routingActions';
import { startFocusSession, transitionToRewardSelection } from '../actions/timerActions';
import { setWorkHours } from '../actions/workHoursActions';
import {
  selectBlockedSites,
  selectCurrentQuestion,
  selectFatigueScore,
  selectGeneratedRewards,
  selectHasOnboarded,
  selectIsPaused,
  selectIsQuizComplete,
  selectMomentumScore,
  selectQuizResults,
  selectRerolls,
  selectSelectedChoices,
  selectSessionState,
  selectShownRewardCombinations,
  selectTimerState,
  selectWorkHoursEntries,
  setInRewardSelection,
} from './index';

const createState = (): RootState => ({
  timer: timerReducer(
    timerReducer(timerReducer(undefined, startFocusSession()), transitionToRewardSelection()),
    { type: 'test/noop' }
  ),
  workHours: workHoursReducer(
    undefined,
    setWorkHours([
      {
        id: 'weekday',
        time: '09:00',
        days: [true, true, true, true, true, false, false],
        enabled: true,
      },
    ])
  ),
  blockedSites: blockedSitesReducer(undefined, addBlockedSite('news.example')),
  routing: routingReducer(undefined, completeOnboarding()),
  quiz: quizReducer(
    undefined,
    selectOption({
      id: 'Q1_A',
      text: 'Choice',
      mbti: ['F'],
      friction: ['EMO'],
      next: 'Q2',
    })
  ),
  settingsProjection: settingsProjectionReducer(undefined, { type: 'test/init' }),
});

describe('Redux selectors', () => {
  it('selects timer state fields', () => {
    const state = createState();

    expect(selectTimerState(state)).toBe(state.timer);
    expect(selectSessionState(state)).toBe(SESSION_STATES.REWARD_SELECTION);
    expect(selectIsPaused(state)).toBe(false);
    expect(selectRerolls(state)).toBe(state.timer.rerolls);
    expect(selectGeneratedRewards(state)).toEqual([]);
    expect(selectShownRewardCombinations(state)).toEqual([]);
    expect(setInRewardSelection(state)).toBe(true);
    expect(selectFatigueScore(state)).toBe(state.timer.fatigueScore);
    expect(selectMomentumScore(state)).toBe(state.timer.momentumScore);
  });

  it('selects work hours, blocked sites, routing, and quiz fields', () => {
    const state = createState();

    expect(selectWorkHoursEntries(state)).toEqual(state.workHours.entries);
    expect(selectBlockedSites(state)).toContain('news.example');
    expect(selectHasOnboarded(state)).toBe(true);
    expect(selectSelectedChoices(state)).toHaveLength(1);
    expect(selectIsQuizComplete(state)).toBe(false);
    expect(selectQuizResults(state)).toBeNull();
    expect(selectCurrentQuestion(state)?.id).toBe('Q2');
  });
});
