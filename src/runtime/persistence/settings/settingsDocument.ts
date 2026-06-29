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

export const THEME_PREFERENCES = ['system', 'light', 'dark'] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];

export interface SettingsValue {
  themePreference: ThemePreference;
  workHours: WorkHoursEntry[];
  blockedSites: string[];
  hasOnboarded: boolean;
  quiz: QuizState;
  windDownSoundEnabled: boolean;
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
  themePreference: 'system',
  workHours: [],
  blockedSites: [...DEFAULT_BLOCKED_SITES],
  hasOnboarded: false,
  quiz: {
    currentQuestionId: 'Q1',
    selectedChoices: [],
    isComplete: false,
    results: null,
  },
  windDownSoundEnabled: false,
});
