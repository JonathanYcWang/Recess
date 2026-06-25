import type { FrictionDimension } from '@/modules/workstyle-profile';
import {
  createPetMoodAssets,
  PET_CATALOG_VERSION,
  type PetCatalog,
  type PetDefinition,
} from './petCatalogTypes';

export const pairKeyFromDimensions = (
  first: FrictionDimension,
  second: FrictionDimension
): string => {
  const [left, right] = first < second ? [first, second] : [second, first];
  return `${left}|${right}`;
};

const definePet = (id: string, name: string, personalityCopy: string): PetDefinition => ({
  id,
  name,
  personalityCopy,
  moodAssets: createPetMoodAssets(id, name),
});

const petDefinitions: PetDefinition[] = [
  definePet(
    'pet-anchor',
    'Anchor',
    'Steady and reassuring when work feels heavy and motivation is hard to find.'
  ),
  definePet(
    'pet-atlas',
    'Atlas',
    'Calm under emotional weight and naturally helps sort scattered priorities.'
  ),
  definePet(
    'pet-beacon',
    'Beacon',
    'Gentle and alert—helps you return when stress and distractions compete.'
  ),
  definePet(
    'pet-bridge',
    'Bridge',
    'Patient at the threshold, easing the step from emotional load into action.'
  ),
  definePet(
    'pet-drift',
    'Drift',
    'Soft-spirited and restorative when pressure and fatigue arrive together.'
  ),
  definePet(
    'pet-ember',
    'Ember',
    'Warm but easily dampened—benefits from clear structure and small wins.'
  ),
  definePet(
    'pet-flux',
    'Flux',
    'Curious and quick-moving; thrives when distractions are gently contained.'
  ),
  definePet(
    'pet-harbor',
    'Harbor',
    'Inviting at the start line when motivation and hesitation meet.'
  ),
  definePet(
    'pet-haven',
    'Haven',
    'Low-key and restorative when drive fades before energy returns.'
  ),
  definePet(
    'pet-helm',
    'Helm',
    'Organized at heart and sensitive to interruptions that break flow.'
  ),
  definePet(
    'pet-latch',
    'Latch',
    'Methodical and supportive when planning and starting both feel sticky.'
  ),
  definePet(
    'pet-ledger',
    'Ledger',
    'Orderly and honest about limits when structure and tiredness overlap.'
  ),
  definePet(
    'pet-nudge',
    'Nudge',
    'Light-footed and playful—helps redirect attention back to the task.'
  ),
  definePet('pet-pause', 'Pause', 'Understands when attention wanders and energy is running low.'),
  definePet(
    'pet-summit',
    'Summit',
    'Encouraging at the first step and patient through late-session fatigue.'
  ),
  definePet(
    'pet-tide',
    'Tide',
    'Even-keeled across many friction patterns—a balanced working companion.'
  ),
];

const assignmentEntries: Array<[string, string]> = [
  [pairKeyFromDimensions('emotional-load', 'motivation'), 'pet-anchor'],
  [pairKeyFromDimensions('emotional-load', 'organization'), 'pet-atlas'],
  [pairKeyFromDimensions('emotional-load', 'distraction'), 'pet-beacon'],
  [pairKeyFromDimensions('emotional-load', 'starting'), 'pet-bridge'],
  [pairKeyFromDimensions('emotional-load', 'fatigue'), 'pet-drift'],
  [pairKeyFromDimensions('motivation', 'organization'), 'pet-ember'],
  [pairKeyFromDimensions('motivation', 'distraction'), 'pet-flux'],
  [pairKeyFromDimensions('motivation', 'starting'), 'pet-harbor'],
  [pairKeyFromDimensions('motivation', 'fatigue'), 'pet-haven'],
  [pairKeyFromDimensions('organization', 'distraction'), 'pet-helm'],
  [pairKeyFromDimensions('organization', 'starting'), 'pet-latch'],
  [pairKeyFromDimensions('organization', 'fatigue'), 'pet-ledger'],
  [pairKeyFromDimensions('distraction', 'starting'), 'pet-nudge'],
  [pairKeyFromDimensions('distraction', 'fatigue'), 'pet-pause'],
  [pairKeyFromDimensions('starting', 'fatigue'), 'pet-summit'],
  ['balanced', 'pet-tide'],
];

export const petCatalog: PetCatalog = {
  version: PET_CATALOG_VERSION,
  pets: petDefinitions,
  assignmentMap: Object.fromEntries(assignmentEntries),
};

export const getPetById = (petId: string): PetDefinition | undefined =>
  petDefinitions.find((pet) => pet.id === petId);

export const resolvePetIdFromQuizOutcome = (
  outcome:
    | { kind: 'balanced' }
    | { kind: 'top-two'; dimensions: readonly [FrictionDimension, FrictionDimension] }
): string | undefined => {
  const key =
    outcome.kind === 'balanced'
      ? 'balanced'
      : pairKeyFromDimensions(outcome.dimensions[0], outcome.dimensions[1]);
  return petCatalog.assignmentMap[key];
};
