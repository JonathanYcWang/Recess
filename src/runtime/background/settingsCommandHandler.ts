import type {
  PersistedApplicationState,
  SettingsValue,
  ThemePreference,
  VersionedDocument,
} from '@/modules/persisted-application-state';
import { THEME_PREFERENCES } from '@/modules/persisted-application-state';
import type { SettingsCommandHandler, SettingsRuntimeResult, SettingsSnapshot } from '../types';

const isThemePreference = (value: unknown): value is ThemePreference =>
  typeof value === 'string' && THEME_PREFERENCES.some((preference) => preference === value);

const cloneSettingsValue = (value: SettingsValue): SettingsValue => ({
  themePreference: value.themePreference,
  workHours: value.workHours.map((entry) => ({
    ...entry,
    days: [...entry.days],
  })),
  blockedSites: [...value.blockedSites],
  hasOnboarded: value.hasOnboarded,
  quiz: {
    ...value.quiz,
    selectedChoices: value.quiz.selectedChoices.map((choice) => ({ ...choice })),
    results: value.quiz.results ? { ...value.quiz.results } : null,
  },
});

const cloneSnapshot = (snapshot: SettingsSnapshot): SettingsSnapshot => ({
  ...snapshot,
  value: cloneSettingsValue(snapshot.value),
});

export const createSettingsCommandHandler = (
  persistence: PersistedApplicationState,
  initialized: VersionedDocument<SettingsValue>
): SettingsCommandHandler => {
  let current = cloneSnapshot(initialized);

  return {
    current(): SettingsRuntimeResult {
      return { ok: true, value: cloneSnapshot(current) };
    },

    async dispatch(intent): Promise<SettingsRuntimeResult> {
      if (!isThemePreference(intent.preference)) {
        return { ok: false, error: { kind: 'invalid-theme-preference' } };
      }

      const committed = await persistence.commit([
        {
          document: 'settings',
          expectedRevision: current.revision,
          value: {
            ...current.value,
            themePreference: intent.preference,
          },
        },
      ]);
      if (!committed.ok) {
        return { ok: false, error: { kind: 'persistence-failed' } };
      }

      const settings = committed.value.documents.settings;
      if (!settings) {
        return { ok: false, error: { kind: 'persistence-failed' } };
      }
      current = cloneSnapshot(settings);
      return { ok: true, value: cloneSnapshot(current) };
    },
  };
};
