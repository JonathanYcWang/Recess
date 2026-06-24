import type { EnergyLevel, MomentumLevel, PreferredCadence } from '@/modules/workstyle-profile';
import {
  cadenceToBaseDurations,
  DEFAULT_CADENCE,
  MAX_RECESS_MINUTES,
  MIN_RECESS_MINUTES,
} from './cadence';
import type { SchedulerReason } from './decide';

export interface PostGameRecessInput {
  preferredCadence: PreferredCadence;
  energy: EnergyLevel;
  momentum: MomentumLevel;
  workSessionProgressRatio: number;
  selectedTaskRemainingSeconds: number | null;
  remainingWorkSessionSeconds: number;
}

export interface PostGameRecessDecision {
  recessMinutes: number;
  recessSeconds: number;
  reasons: SchedulerReason[];
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const decidePostGameRecess = (input: PostGameRecessInput): PostGameRecessDecision => {
  const reasons: SchedulerReason[] = [];
  const cadence = input.preferredCadence ?? DEFAULT_CADENCE;
  const base = cadenceToBaseDurations(cadence);
  let recessMinutes = base.recessMinutes;
  reasons.push({
    code: 'base-cadence',
    focusDeltaMinutes: 0,
    recessDeltaMinutes: base.recessMinutes,
  });

  if (input.energy === 'low') {
    recessMinutes += 3;
    reasons.push({ code: 'energy-low', focusDeltaMinutes: 0, recessDeltaMinutes: 3 });
  } else if (input.energy === 'high') {
    recessMinutes -= 2;
    reasons.push({ code: 'energy-high', focusDeltaMinutes: 0, recessDeltaMinutes: -2 });
  }

  if (input.momentum === 'low') {
    recessMinutes += 3;
    reasons.push({ code: 'momentum-low', focusDeltaMinutes: 0, recessDeltaMinutes: 3 });
  } else if (input.momentum === 'building') {
    recessMinutes -= 1;
    reasons.push({ code: 'momentum-building', focusDeltaMinutes: 0, recessDeltaMinutes: -1 });
  } else if (input.momentum === 'flowing') {
    recessMinutes -= 3;
    reasons.push({ code: 'momentum-flowing', focusDeltaMinutes: 0, recessDeltaMinutes: -3 });
  }

  if (input.workSessionProgressRatio >= 2 / 3) {
    recessMinutes += 3;
    reasons.push({ code: 'two-thirds-progress', focusDeltaMinutes: 0, recessDeltaMinutes: 3 });
  }

  recessMinutes = clamp(recessMinutes, MIN_RECESS_MINUTES, MAX_RECESS_MINUTES);
  const remainingMinutes = Math.floor(input.remainingWorkSessionSeconds / 60);
  if (remainingMinutes < recessMinutes) {
    const exact = clamp(remainingMinutes, MIN_RECESS_MINUTES, MAX_RECESS_MINUTES);
    if (exact !== recessMinutes) {
      reasons.push({
        code: 'post-game-recess-exact',
        focusDeltaMinutes: 0,
        recessDeltaMinutes: exact - recessMinutes,
      });
      recessMinutes = exact;
    }
  }

  return {
    recessMinutes,
    recessSeconds: recessMinutes * 60,
    reasons,
  };
};
