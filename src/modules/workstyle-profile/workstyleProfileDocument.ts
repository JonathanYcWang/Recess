export const PREFERRED_CADENCES = ['15/5', '25/5', '45/10'] as const;
export type PreferredCadence = (typeof PREFERRED_CADENCES)[number];

export const ENERGY_LEVELS = ['low', 'steady', 'high'] as const;
export type EnergyLevel = (typeof ENERGY_LEVELS)[number];

export const MOMENTUM_LEVELS = ['low', 'steady', 'building', 'flowing'] as const;
export type MomentumLevel = (typeof MOMENTUM_LEVELS)[number];

export const FRICTION_DIMENSIONS = [
  'emotional-load',
  'motivation',
  'organization',
  'distraction',
  'starting',
  'fatigue',
] as const;
export type FrictionDimension = (typeof FRICTION_DIMENSIONS)[number];

export const FRICTION_LEVELS = ['low', 'moderate', 'high'] as const;
export type FrictionLevel = (typeof FRICTION_LEVELS)[number];

export interface FrictionProfile {
  emotionalLoad: FrictionLevel;
  motivation: FrictionLevel;
  organization: FrictionLevel;
  distraction: FrictionLevel;
  starting: FrictionLevel;
  fatigue: FrictionLevel;
}

export interface WorkstyleProfileValue {
  preferredCadence: PreferredCadence;
  energy: EnergyLevel;
  momentum: MomentumLevel;
  friction: FrictionProfile;
  assignedPetId: string | null;
  onboardingCompleted: boolean;
}

const DEFAULT_FRICTION: FrictionProfile = {
  emotionalLoad: 'low',
  motivation: 'low',
  organization: 'low',
  distraction: 'low',
  starting: 'low',
  fatigue: 'low',
};

export const createDefaultWorkstyleProfileValue = (): WorkstyleProfileValue => ({
  preferredCadence: '25/5',
  energy: 'steady',
  momentum: 'steady',
  friction: { ...DEFAULT_FRICTION },
  assignedPetId: null,
  onboardingCompleted: false,
});

export const frictionDimensionToField = (dimension: FrictionDimension): keyof FrictionProfile => {
  switch (dimension) {
    case 'emotional-load':
      return 'emotionalLoad';
    case 'motivation':
      return 'motivation';
    case 'organization':
      return 'organization';
    case 'distraction':
      return 'distraction';
    case 'starting':
      return 'starting';
    case 'fatigue':
      return 'fatigue';
  }
};

export const cloneFrictionProfile = (friction: FrictionProfile): FrictionProfile => ({
  emotionalLoad: friction.emotionalLoad,
  motivation: friction.motivation,
  organization: friction.organization,
  distraction: friction.distraction,
  starting: friction.starting,
  fatigue: friction.fatigue,
});

export const cloneWorkstyleProfileValue = (
  value: WorkstyleProfileValue
): WorkstyleProfileValue => ({
  preferredCadence: value.preferredCadence,
  energy: value.energy,
  momentum: value.momentum,
  friction: cloneFrictionProfile(value.friction),
  assignedPetId: value.assignedPetId,
  onboardingCompleted: value.onboardingCompleted,
});
