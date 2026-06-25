import type { EnergyLevel, MomentumLevel, PreferredCadence } from '@/modules/workstyle-profile';
import {
  cadenceToBaseDurations,
  DEFAULT_CADENCE,
  GAME_BUDGET_SECONDS,
  MAX_FOCUS_MINUTES,
  MAX_RECESS_MINUTES,
  MIN_FOCUS_MINUTES,
  MIN_RECESS_MINUTES,
  type RewardGameBudget,
} from './cadence';

export const MIN_TASK_CAP_SECONDS = MIN_FOCUS_MINUTES * 60;

export interface SchedulerInput {
  preferredCadence: PreferredCadence;
  energy: EnergyLevel;
  momentum: MomentumLevel;
  workSessionProgressRatio: number;
  selectedTaskRemainingSeconds: number | null;
  remainingWorkSessionSeconds: number;
  gameBudget: RewardGameBudget;
}

export type SchedulerReasonCode =
  | 'base-cadence'
  | 'energy-low'
  | 'energy-high'
  | 'momentum-low'
  | 'momentum-building'
  | 'momentum-flowing'
  | 'two-thirds-progress'
  | 'focus-clamp-min'
  | 'focus-clamp-max'
  | 'recess-clamp-min'
  | 'recess-clamp-max'
  | 'task-cap'
  | 'final-focus-budget'
  | 'final-focus-exact'
  | 'post-game-recess-exact';

export interface SchedulerReason {
  code: SchedulerReasonCode;
  focusDeltaMinutes: number;
  recessDeltaMinutes: number;
}

export interface SchedulerDecision {
  focusMinutes: number;
  focusDurationSeconds: number;
  recessMinutes: number;
  isFinalFocus: boolean;
  reasons: SchedulerReason[];
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const gameBudgetSeconds = (budget: RewardGameBudget): number => {
  const timing = GAME_BUDGET_SECONDS[budget.kind];
  return timing.decision + timing.animation;
};

const canFitOrdinaryCycle = (remainingSeconds: number, gameBudget: RewardGameBudget): boolean => {
  const requiredSeconds = gameBudgetSeconds(gameBudget) + MIN_RECESS_MINUTES * 60;
  return remainingSeconds >= requiredSeconds;
};

const applyEnergyModifier = (
  energy: EnergyLevel,
  focusMinutes: number,
  recessMinutes: number,
  reasons: SchedulerReason[]
) => {
  if (energy === 'low') {
    focusMinutes -= 5;
    recessMinutes += 3;
    reasons.push({
      code: 'energy-low',
      focusDeltaMinutes: -5,
      recessDeltaMinutes: 3,
    });
  } else if (energy === 'high') {
    focusMinutes += 5;
    recessMinutes -= 2;
    reasons.push({
      code: 'energy-high',
      focusDeltaMinutes: 5,
      recessDeltaMinutes: -2,
    });
  }
  return { focusMinutes, recessMinutes };
};

const applyMomentumModifier = (
  momentum: MomentumLevel,
  focusMinutes: number,
  recessMinutes: number,
  reasons: SchedulerReason[]
) => {
  switch (momentum) {
    case 'low':
      focusMinutes -= 5;
      recessMinutes += 3;
      reasons.push({
        code: 'momentum-low',
        focusDeltaMinutes: -5,
        recessDeltaMinutes: 3,
      });
      break;
    case 'building':
      focusMinutes += 3;
      recessMinutes -= 1;
      reasons.push({
        code: 'momentum-building',
        focusDeltaMinutes: 3,
        recessDeltaMinutes: -1,
      });
      break;
    case 'flowing':
      focusMinutes += 5;
      recessMinutes -= 3;
      reasons.push({
        code: 'momentum-flowing',
        focusDeltaMinutes: 5,
        recessDeltaMinutes: -3,
      });
      break;
    case 'steady':
      break;
  }
  return { focusMinutes, recessMinutes };
};

const applyProgressModifier = (
  progressRatio: number,
  focusMinutes: number,
  recessMinutes: number,
  reasons: SchedulerReason[]
) => {
  if (progressRatio >= 2 / 3) {
    focusMinutes -= 5;
    recessMinutes += 3;
    reasons.push({
      code: 'two-thirds-progress',
      focusDeltaMinutes: -5,
      recessDeltaMinutes: 3,
    });
  }
  return { focusMinutes, recessMinutes };
};

const clampFocus = (focusMinutes: number, reasons: SchedulerReason[]): number => {
  if (focusMinutes < MIN_FOCUS_MINUTES) {
    reasons.push({
      code: 'focus-clamp-min',
      focusDeltaMinutes: MIN_FOCUS_MINUTES - focusMinutes,
      recessDeltaMinutes: 0,
    });
    return MIN_FOCUS_MINUTES;
  }
  if (focusMinutes > MAX_FOCUS_MINUTES) {
    reasons.push({
      code: 'focus-clamp-max',
      focusDeltaMinutes: MAX_FOCUS_MINUTES - focusMinutes,
      recessDeltaMinutes: 0,
    });
    return MAX_FOCUS_MINUTES;
  }
  return focusMinutes;
};

const clampRecess = (recessMinutes: number, reasons: SchedulerReason[]): number => {
  if (recessMinutes < MIN_RECESS_MINUTES) {
    reasons.push({
      code: 'recess-clamp-min',
      focusDeltaMinutes: 0,
      recessDeltaMinutes: MIN_RECESS_MINUTES - recessMinutes,
    });
    return MIN_RECESS_MINUTES;
  }
  if (recessMinutes > MAX_RECESS_MINUTES) {
    reasons.push({
      code: 'recess-clamp-max',
      focusDeltaMinutes: 0,
      recessDeltaMinutes: MAX_RECESS_MINUTES - recessMinutes,
    });
    return MAX_RECESS_MINUTES;
  }
  return recessMinutes;
};

const applyEligibleTaskCap = (
  focusDurationSeconds: number,
  proposedFocusMinutes: number,
  selectedTaskRemainingSeconds: number | null,
  reasons: SchedulerReason[]
): number => {
  if (
    selectedTaskRemainingSeconds === null ||
    selectedTaskRemainingSeconds < MIN_TASK_CAP_SECONDS ||
    selectedTaskRemainingSeconds >= focusDurationSeconds
  ) {
    return focusDurationSeconds;
  }

  reasons.push({
    code: 'task-cap',
    focusDeltaMinutes: selectedTaskRemainingSeconds / 60 - proposedFocusMinutes,
    recessDeltaMinutes: 0,
  });
  return selectedTaskRemainingSeconds;
};

export const decideFocusRecessCycle = (input: SchedulerInput): SchedulerDecision => {
  const reasons: SchedulerReason[] = [];
  const cadence = input.preferredCadence ?? DEFAULT_CADENCE;
  const base = cadenceToBaseDurations(cadence);
  let focusMinutes = base.focusMinutes;
  let recessMinutes = base.recessMinutes;
  reasons.push({
    code: 'base-cadence',
    focusDeltaMinutes: base.focusMinutes,
    recessDeltaMinutes: base.recessMinutes,
  });

  ({ focusMinutes, recessMinutes } = applyEnergyModifier(
    input.energy,
    focusMinutes,
    recessMinutes,
    reasons
  ));
  ({ focusMinutes, recessMinutes } = applyMomentumModifier(
    input.momentum,
    focusMinutes,
    recessMinutes,
    reasons
  ));
  ({ focusMinutes, recessMinutes } = applyProgressModifier(
    input.workSessionProgressRatio,
    focusMinutes,
    recessMinutes,
    reasons
  ));

  const proposedFocusMinutes = clampFocus(focusMinutes, reasons);
  recessMinutes = clampRecess(recessMinutes, reasons);

  const remainingMinutes = input.remainingWorkSessionSeconds / 60;
  const fitsOrdinaryCycle = canFitOrdinaryCycle(
    input.remainingWorkSessionSeconds,
    input.gameBudget
  );
  let focusDurationSeconds = proposedFocusMinutes * 60;

  if (fitsOrdinaryCycle && focusDurationSeconds <= input.remainingWorkSessionSeconds) {
    focusDurationSeconds = applyEligibleTaskCap(
      focusDurationSeconds,
      proposedFocusMinutes,
      input.selectedTaskRemainingSeconds,
      reasons
    );
    focusMinutes = focusDurationSeconds / 60;
  } else {
    focusMinutes = proposedFocusMinutes;
  }

  if (!fitsOrdinaryCycle) {
    reasons.push({
      code: 'final-focus-budget',
      focusDeltaMinutes: 0,
      recessDeltaMinutes: 0,
    });
    const exactFocusMinutes = Math.max(0, Math.floor(remainingMinutes));
    const exactFocusDurationSeconds = exactFocusMinutes * 60;
    reasons.push({
      code: 'final-focus-exact',
      focusDeltaMinutes: exactFocusMinutes - focusMinutes,
      recessDeltaMinutes: 0,
    });
    return {
      focusMinutes: exactFocusMinutes,
      focusDurationSeconds: exactFocusDurationSeconds,
      recessMinutes: 0,
      isFinalFocus: true,
      reasons,
    };
  }

  if (focusDurationSeconds > input.remainingWorkSessionSeconds) {
    const exactFocusMinutes = Math.max(0, Math.floor(remainingMinutes));
    const exactFocusDurationSeconds = exactFocusMinutes * 60;
    reasons.push({
      code: 'final-focus-exact',
      focusDeltaMinutes: exactFocusMinutes - focusMinutes,
      recessDeltaMinutes: 0,
    });
    return {
      focusMinutes: exactFocusMinutes,
      focusDurationSeconds: exactFocusDurationSeconds,
      recessMinutes: 0,
      isFinalFocus: true,
      reasons,
    };
  }

  const postGameRemainingMinutes =
    remainingMinutes - focusDurationSeconds / 60 - gameBudgetSeconds(input.gameBudget) / 60;
  if (postGameRemainingMinutes < recessMinutes) {
    const exactRecessMinutes = clamp(
      Math.floor(Math.max(0, postGameRemainingMinutes)),
      MIN_RECESS_MINUTES,
      MAX_RECESS_MINUTES
    );
    if (exactRecessMinutes !== recessMinutes) {
      reasons.push({
        code: 'post-game-recess-exact',
        focusDeltaMinutes: 0,
        recessDeltaMinutes: exactRecessMinutes - recessMinutes,
      });
      recessMinutes = exactRecessMinutes;
    }
  }

  return {
    focusMinutes,
    focusDurationSeconds,
    recessMinutes,
    isFinalFocus: false,
    reasons,
  };
};
