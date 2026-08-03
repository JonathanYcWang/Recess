import { describe, expect, it } from 'vitest';
import { DEFAULT_REROLLS, SCHEDULER_PHASE } from '@/Shared/Constants/Constants';
import { createDefaultPersistedAppState } from '@/Background/ActionHandlers/ActionHandlerHelpers';
import type { PersistedAppState, RecessPickerState, SchedulerState } from '@/Shared/Types/AppState';
import {
  enterRecessPicker,
  exitRecess,
  isEnteringRecessPicker,
  isExitingRecess,
} from '@/Background/ActionHandlers/ActionHandlerHelpers';

const sampleReward = { id: '1', name: 'youtube.com', duration: 10 };

const recessPickerWithSelection = (): RecessPickerState => ({
  rerolls: 1,
  selectedRecess: sampleReward,
  recessOptions: [sampleReward],
});

const schedulerInPhase = (
  phase: SchedulerState['activePhase'],
  overrides: Partial<SchedulerState> = {}
): SchedulerState => ({
  ...createDefaultPersistedAppState().scheduler,
  activePhase: phase,
  phaseStart: '2026-01-01T00:00:00.000Z',
  phaseTarget: 300,
  ...overrides,
});

describe('isEnteringRecessPicker', () => {
  it('is true when Focus Block becomes Reward Game with a block list', () => {
    const state: PersistedAppState = {
      ...createDefaultPersistedAppState(),
      blockList: [{ url: 'youtube.com', isBlocked: false }],
      scheduler: schedulerInPhase(SCHEDULER_PHASE.FOCUS_BLOCK),
    };

    expect(isEnteringRecessPicker(state, schedulerInPhase(SCHEDULER_PHASE.REWARD_GAME))).toBe(true);
  });

  it('is false while Reward Game continues unchanged', () => {
    const rewardGame = schedulerInPhase(SCHEDULER_PHASE.REWARD_GAME);
    const state: PersistedAppState = {
      ...createDefaultPersistedAppState(),
      blockList: [{ url: 'youtube.com', isBlocked: false }],
      scheduler: rewardGame,
    };

    expect(isEnteringRecessPicker(state, rewardGame)).toBe(false);
  });

  it('is false when next phase is not Reward Game', () => {
    const state: PersistedAppState = {
      ...createDefaultPersistedAppState(),
      blockList: [{ url: 'youtube.com', isBlocked: false }],
      scheduler: schedulerInPhase(SCHEDULER_PHASE.FOCUS_BLOCK),
    };

    expect(isEnteringRecessPicker(state, schedulerInPhase(SCHEDULER_PHASE.FOCUS_BLOCK))).toBe(
      false
    );
  });
});

describe('isExitingRecess', () => {
  it('is true when Recess becomes Focus Block', () => {
    expect(
      isExitingRecess(
        {
          ...createDefaultPersistedAppState(),
          scheduler: schedulerInPhase(SCHEDULER_PHASE.RECESS),
        },
        schedulerInPhase(SCHEDULER_PHASE.FOCUS_BLOCK)
      )
    ).toBe(true);
  });

  it('is false when entering Recess from Reward Game', () => {
    expect(
      isExitingRecess(
        {
          ...createDefaultPersistedAppState(),
          scheduler: schedulerInPhase(SCHEDULER_PHASE.REWARD_GAME),
        },
        schedulerInPhase(SCHEDULER_PHASE.RECESS)
      )
    ).toBe(false);
  });
});

describe('enterRecessPicker', () => {
  it('sets up picker and scheduler', () => {
    const state: PersistedAppState = {
      ...createDefaultPersistedAppState(),
      blockList: [{ url: 'youtube.com', isBlocked: false }],
      scheduler: schedulerInPhase(SCHEDULER_PHASE.FOCUS_BLOCK),
      recessPicker: recessPickerWithSelection(),
    };
    const nextScheduler = schedulerInPhase(SCHEDULER_PHASE.REWARD_GAME);

    const result = enterRecessPicker(state, nextScheduler);

    expect(result.scheduler).toBe(nextScheduler);
    expect(result.recessPicker.selectedRecess).toBeNull();
    expect(result.recessPicker.rerolls).toBe(DEFAULT_REROLLS);
    expect(result.recessPicker.recessOptions.length).toBeGreaterThan(0);
  });
});

describe('exitRecess', () => {
  it('resets picker and sets scheduler', () => {
    const state: PersistedAppState = {
      ...createDefaultPersistedAppState(),
      scheduler: schedulerInPhase(SCHEDULER_PHASE.RECESS),
      recessPicker: recessPickerWithSelection(),
    };
    const nextScheduler = schedulerInPhase(SCHEDULER_PHASE.FOCUS_BLOCK);

    const result = exitRecess(state, nextScheduler);

    expect(result.scheduler).toBe(nextScheduler);
    expect(result.recessPicker).toEqual({
      rerolls: DEFAULT_REROLLS,
      selectedRecess: null,
      recessOptions: [],
    });
  });
});

describe('scheduler transition branching', () => {
  it('resets picker when evaluate leaves Recess', () => {
    const state: PersistedAppState = {
      ...createDefaultPersistedAppState(),
      blockList: [{ url: 'youtube.com', isBlocked: false }],
      scheduler: schedulerInPhase(SCHEDULER_PHASE.RECESS),
      recessPicker: recessPickerWithSelection(),
    };
    const nextScheduler = schedulerInPhase(SCHEDULER_PHASE.FOCUS_BLOCK);

    const result = isExitingRecess(state, nextScheduler)
      ? exitRecess(state, nextScheduler)
      : { ...state, scheduler: nextScheduler };

    expect(result.recessPicker.selectedRecess).toBeNull();
    expect(result.recessPicker.recessOptions).toEqual([]);
  });
});
