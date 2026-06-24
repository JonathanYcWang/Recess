import type { Result } from '@/modules/persisted-application-state/types';
import { decideFocusRecessCycle } from '@/modules/scheduler';
import type { RewardGameBudget } from '@/modules/scheduler';
import {
  ENERGY_LEVELS,
  type EnergyLevel,
  type PreferredCadence,
} from '@/modules/workstyle-profile';
import {
  cloneWorkRhythmValue,
  isValidWorkSessionGoalSeconds,
  type WorkRhythmValue,
} from './workRhythmDocument';
import { decideEndWorkSessionEarly } from './endWorkSessionEarly';
import { decideFocusBoundarySettlement } from './settleFocusBoundary';

const includes = <T extends string>(values: readonly T[], candidate: string): candidate is T =>
  (values as readonly string[]).includes(candidate);

export type WorkRhythmCommand =
  | { kind: 'start-work-session'; goalSeconds: unknown; energy: unknown }
  | { kind: 'settle-focus-boundary' }
  | { kind: 'end-work-session' };

export type WorkRhythmDecisionError =
  | { kind: 'invalid-goal' }
  | { kind: 'invalid-energy' }
  | { kind: 'session-already-active' }
  | { kind: 'invalid-phase-for-settlement' }
  | { kind: 'boundary-not-due' }
  | { kind: 'no-active-work-session' }
  | { kind: 'original-goal-already-complete' };

export interface WorkRhythmDecisionContext {
  nowEpochMs: number;
  sessionId: string;
  preferredCadence: PreferredCadence;
  selectedTaskRemainingMinutes: number | null;
  gameBudget: RewardGameBudget;
}

const parseGoalSeconds = (value: unknown): Result<number, WorkRhythmDecisionError> => {
  if (typeof value !== 'number' || !isValidWorkSessionGoalSeconds(value)) {
    return { ok: false, error: { kind: 'invalid-goal' } };
  }
  return { ok: true, value };
};

const parseEnergy = (value: unknown): Result<EnergyLevel, WorkRhythmDecisionError> => {
  if (typeof value !== 'string' || !includes(ENERGY_LEVELS, value)) {
    return { ok: false, error: { kind: 'invalid-energy' } };
  }
  return { ok: true, value };
};

export const applyWorkRhythmCommand = (
  current: WorkRhythmValue,
  command: WorkRhythmCommand,
  context: WorkRhythmDecisionContext
): Result<WorkRhythmValue, WorkRhythmDecisionError> => {
  if (command.kind === 'start-work-session') {
    if (current.phase !== 'inactive') {
      return { ok: false, error: { kind: 'session-already-active' } };
    }

    const goal = parseGoalSeconds(command.goalSeconds);
    if (!goal.ok) {
      return goal;
    }
    const energy = parseEnergy(command.energy);
    if (!energy.ok) {
      return energy;
    }

    const schedulerDecision = decideFocusRecessCycle({
      preferredCadence: context.preferredCadence,
      energy: energy.value,
      momentum: 'steady',
      workSessionProgressRatio: 0,
      selectedTaskRemainingMinutes: context.selectedTaskRemainingMinutes,
      remainingWorkSessionSeconds: goal.value,
      gameBudget: context.gameBudget,
    });

    const focusDurationSeconds = schedulerDecision.focusMinutes * 60;
    const focusDeadlineAtEpochMs = context.nowEpochMs + focusDurationSeconds * 1000;

    return {
      ok: true,
      value: {
        phase: 'focus-block',
        sessionId: context.sessionId,
        originalGoalSeconds: goal.value,
        sessionStartedAtEpochMs: context.nowEpochMs,
        remainingWorkSessionSeconds: goal.value,
        settledRemainingWorkSessionSeconds: goal.value,
        energy: energy.value,
        momentum: 'steady',
        focusBlockIndex: 0,
        focusBlockStartedAtEpochMs: context.nowEpochMs,
        focusDeadlineAtEpochMs,
        focusDurationSeconds,
        isFinalFocus: schedulerDecision.isFinalFocus,
        wasExtension: false,
        schedulerReasons: schedulerDecision.reasons.map((reason) => ({ ...reason })),
        focusBlockStreak: 0,
      },
    };
  }

  if (command.kind === 'settle-focus-boundary') {
    if (current.phase !== 'focus-block') {
      return { ok: false, error: { kind: 'invalid-phase-for-settlement' } };
    }
    const settled = decideFocusBoundarySettlement(current, context.nowEpochMs);
    if (!settled.ok) {
      return { ok: false, error: settled.error };
    }
    return { ok: true, value: settled.value.nextValue };
  }

  if (command.kind === 'end-work-session') {
    const ended = decideEndWorkSessionEarly(current, context.nowEpochMs);
    if (!ended.ok) {
      return { ok: false, error: ended.error };
    }
    return { ok: true, value: ended.value.nextValue };
  }

  return { ok: false, error: { kind: 'session-already-active' } };
};

export const reconstructWorkRhythmValue = (value: WorkRhythmValue): WorkRhythmValue =>
  cloneWorkRhythmValue(value);
