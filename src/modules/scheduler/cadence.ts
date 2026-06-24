import type { PreferredCadence } from '@/modules/workstyle-profile';

export type RewardGameKind = 'cards' | 'wheel' | 'slots';

export interface RewardGameBudget {
  kind: RewardGameKind;
}

export const GAME_BUDGET_SECONDS: Record<RewardGameKind, { decision: number; animation: number }> =
  {
    cards: { decision: 10, animation: 0 },
    wheel: { decision: 5, animation: 3 },
    slots: { decision: 5, animation: 3 },
  };

export const MIN_FOCUS_MINUTES = 15;
export const MAX_FOCUS_MINUTES = 60;
export const MIN_RECESS_MINUTES = 5;
export const MAX_RECESS_MINUTES = 20;
export const DEFAULT_CADENCE: PreferredCadence = '25/5';

export const cadenceToBaseDurations = (
  cadence: PreferredCadence
): { focusMinutes: number; recessMinutes: number } => {
  switch (cadence) {
    case '15/5':
      return { focusMinutes: 15, recessMinutes: 5 };
    case '25/5':
      return { focusMinutes: 25, recessMinutes: 5 };
    case '45/10':
      return { focusMinutes: 45, recessMinutes: 10 };
  }
};
