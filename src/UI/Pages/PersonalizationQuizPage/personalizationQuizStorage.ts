import type { FrictionProfile } from '@/modules/workstyle-profile';
import type { FrictionScoreEffects } from '@/modules/personalization-quiz/personalizationQuizTypes';

const PERSONALIZATION_QUIZ_PROGRESS_KEY = '__recess_personalization_quiz_progress';

export type PersonalizationQuizProgress = {
  askedScenarioIds: string[];
  scores: FrictionScoreEffects;
  baselineFriction: FrictionProfile;
  dismissed: boolean;
};

export const createEmptyPersonalizationQuizProgress = (
  baselineFriction: FrictionProfile
): PersonalizationQuizProgress => ({
  askedScenarioIds: [],
  scores: {
    'emotional-load': 0,
    motivation: 0,
    organization: 0,
    distraction: 0,
    starting: 0,
    fatigue: 0,
  },
  baselineFriction: { ...baselineFriction },
  dismissed: false,
});

export const loadPersonalizationQuizProgress =
  async (): Promise<PersonalizationQuizProgress | null> => {
    if (typeof chrome === 'undefined' || !chrome.storage?.local) {
      return null;
    }
    const stored = await chrome.storage.local.get(PERSONALIZATION_QUIZ_PROGRESS_KEY);
    const progress = stored[PERSONALIZATION_QUIZ_PROGRESS_KEY];
    if (!progress || typeof progress !== 'object') {
      return null;
    }
    return progress as PersonalizationQuizProgress;
  };

export const savePersonalizationQuizProgress = async (
  progress: PersonalizationQuizProgress
): Promise<void> => {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    return;
  }
  await chrome.storage.local.set({ [PERSONALIZATION_QUIZ_PROGRESS_KEY]: progress });
};

export const clearPersonalizationQuizProgress = async (): Promise<void> => {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    return;
  }
  await chrome.storage.local.remove(PERSONALIZATION_QUIZ_PROGRESS_KEY);
};

const sendWorkstyleProfileCommand = async (command: Record<string, unknown>) => {
  return chrome.runtime.sendMessage({
    channel: 'recess.workstyle-profile.runtime.v1',
    action: 'command',
    envelope: {
      protocolVersion: 1,
      commandId: `personalization-quiz-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      module: 'workstyle-profile',
      command,
    },
  });
};

export const enrichFrictionFromPersonalizationQuiz = async (friction: FrictionProfile) => {
  return sendWorkstyleProfileCommand({
    kind: 'enrich-friction-from-personalization-quiz',
    friction,
  });
};

export const completePersonalizationQuiz = async (
  outcome: { kind: 'balanced' } | { kind: 'top-two'; dimensions: readonly [string, string] }
) => {
  return sendWorkstyleProfileCommand({
    kind: 'complete-personalization-quiz',
    outcome,
  });
};

export const restoreFrictionBaseline = async (friction: FrictionProfile) => {
  return sendWorkstyleProfileCommand({
    kind: 'restore-friction-baseline',
    friction,
  });
};

export const fetchCurrentWorkstyleProfile = async () => {
  return chrome.runtime.sendMessage({
    channel: 'recess.workstyle-profile.runtime.v1',
    action: 'current',
  });
};
