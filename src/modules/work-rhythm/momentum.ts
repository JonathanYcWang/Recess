import type { MomentumLevel } from '@/modules/workstyle-profile';

export const lowerMomentumOneStep = (momentum: MomentumLevel): MomentumLevel => {
  switch (momentum) {
    case 'flowing':
      return 'building';
    case 'building':
      return 'steady';
    case 'steady':
      return 'low';
    case 'low':
      return 'low';
  }
};
