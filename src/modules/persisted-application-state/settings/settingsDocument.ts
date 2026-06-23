export interface WorkHoursEntry {
  id: string;
  time: string;
  days: boolean[];
  enabled: boolean;
}

export interface QuizOption {
  id: string;
  label: string;
}

export interface QuizResults {
  profileId: string;
  summary: string;
}

export interface QuizState {
  currentQuestionId: string;
  selectedChoices: QuizOption[];
  isComplete: boolean;
  results: QuizResults | null;
}

export interface SettingsValue {
  workHours: WorkHoursEntry[];
  blockedSites: string[];
  hasOnboarded: boolean;
  quiz: QuizState;
}

const DEFAULT_BLOCKED_SITES = [
  'youtube.com',
  'instagram.com',
  'facebook.com',
  'messenger.com',
  'web.whatsapp.com',
  'discord.com',
  'tiktok.com',
  'netflix.com',
  'primevideo.com',
  'amazon.com',
  'reddit.com',
];

export const createDefaultSettingsValue = (): SettingsValue => ({
  workHours: [],
  blockedSites: [...DEFAULT_BLOCKED_SITES],
  hasOnboarded: false,
  quiz: {
    currentQuestionId: 'Q1',
    selectedChoices: [],
    isComplete: false,
    results: null,
  },
});
