import { describe, expect, it } from 'vitest';
import { DEFAULT_REROLLS, SCHEDULER_PHASE } from '@/Shared/Constants/Constants';
import type { PersistedAppState, RecessPickerState, SchedulerState } from '@/Shared/Types/AppState';
import { createDefaultPersistedAppState } from '@/Shared/Schema/PersistedAppStateSchema';
import {
  applyRecessPickerAfterSchedulerChange,
  withUpdatedScheduler,
} from '@/Shared/Utils/recessPickerOnSchedulerTransition';

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

describe('applyRecessPickerAfterSchedulerChange', () => {
  it('resets when leaving Recess for Focus Block', () => {
    const previous = schedulerInPhase(SCHEDULER_PHASE.RECESS);
    const next = schedulerInPhase(SCHEDULER_PHASE.FOCUS_BLOCK);

    expect(applyRecessPickerAfterSchedulerChange(recessPickerWithSelection(), previous, next)).toEqual({
      rerolls: DEFAULT_REROLLS,
      selectedRecess: null,
      recessOptions: [],
    });
  });

  it('resets when leaving Recess for no active phase', () => {
    const previous = schedulerInPhase(SCHEDULER_PHASE.RECESS);
    const next = schedulerInPhase(null);

    expect(applyRecessPickerAfterSchedulerChange(recessPickerWithSelection(), previous, next)).toEqual({
      rerolls: DEFAULT_REROLLS,
      selectedRecess: null,
      recessOptions: [],
    });
  });

  it('keeps picker when staying in Recess', () => {
    const previous = schedulerInPhase(SCHEDULER_PHASE.RECESS);
    const next = schedulerInPhase(SCHEDULER_PHASE.RECESS);
    const picker = recessPickerWithSelection();

    expect(applyRecessPickerAfterSchedulerChange(picker, previous, next)).toBe(picker);
  });

  it('keeps picker when entering Recess from Reward Game', () => {
    const previous = schedulerInPhase(SCHEDULER_PHASE.REWARD_GAME);
    const next = schedulerInPhase(SCHEDULER_PHASE.RECESS);
    const picker = recessPickerWithSelection();

    expect(applyRecessPickerAfterSchedulerChange(picker, previous, next)).toBe(picker);
  });

  it('keeps picker when transitioning between non-Recess phases', () => {
    const previous = schedulerInPhase(SCHEDULER_PHASE.FOCUS_BLOCK);
    const next = schedulerInPhase(SCHEDULER_PHASE.REWARD_GAME);
    const picker = recessPickerWithSelection();

    expect(applyRecessPickerAfterSchedulerChange(picker, previous, next)).toBe(picker);
  });
});

describe('withUpdatedScheduler', () => {
  it('updates scheduler and resets recess picker when leaving Recess', () => {
    const state: PersistedAppState = {
      ...createDefaultPersistedAppState(),
      scheduler: schedulerInPhase(SCHEDULER_PHASE.RECESS),
      recessPicker: recessPickerWithSelection(),
    };
    const nextScheduler = schedulerInPhase(SCHEDULER_PHASE.FOCUS_BLOCK);

    const result = withUpdatedScheduler(state, nextScheduler);

    expect(result.scheduler).toBe(nextScheduler);
    expect(result.recessPicker).toEqual({
      rerolls: DEFAULT_REROLLS,
      selectedRecess: null,
      recessOptions: [],
    });
  });
});
