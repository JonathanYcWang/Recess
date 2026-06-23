import type { DocumentCodec, Result, VersionedDocument } from '../types';
import {
  createDefaultSettingsValue,
  type QuizOption,
  type QuizResults,
  type QuizState,
  type SettingsValue,
  THEME_PREFERENCES,
  type WorkHoursEntry,
} from './settingsDocument';

export const SETTINGS_SCHEMA_VERSION = 1;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === 'string');

const isThemePreference = (value: unknown): value is SettingsValue['themePreference'] =>
  typeof value === 'string' && THEME_PREFERENCES.some((preference) => preference === value);

const parseWorkHoursEntry = (value: unknown): Result<WorkHoursEntry, string> => {
  if (!isRecord(value)) {
    return { ok: false, error: 'workHours entry must be an object' };
  }
  if (typeof value.id !== 'string') {
    return { ok: false, error: 'workHours entry id must be a string' };
  }
  if (typeof value.time !== 'string') {
    return { ok: false, error: 'workHours entry time must be a string' };
  }
  if (!Array.isArray(value.days) || value.days.some((day) => typeof day !== 'boolean')) {
    return { ok: false, error: 'workHours entry days must be booleans' };
  }
  if (typeof value.enabled !== 'boolean') {
    return { ok: false, error: 'workHours entry enabled must be a boolean' };
  }
  return {
    ok: true,
    value: {
      id: value.id,
      time: value.time,
      days: value.days,
      enabled: value.enabled,
    },
  };
};

const parseQuizOption = (value: unknown): Result<QuizOption, string> => {
  if (!isRecord(value)) {
    return { ok: false, error: 'quiz option must be an object' };
  }
  if (typeof value.id !== 'string' || typeof value.label !== 'string') {
    return { ok: false, error: 'quiz option requires id and label strings' };
  }
  return { ok: true, value: { id: value.id, label: value.label } };
};

const parseQuizResults = (value: unknown): Result<QuizResults, string> => {
  if (!isRecord(value)) {
    return { ok: false, error: 'quiz results must be an object' };
  }
  if (typeof value.profileId !== 'string' || typeof value.summary !== 'string') {
    return { ok: false, error: 'quiz results require profileId and summary strings' };
  }
  return { ok: true, value: { profileId: value.profileId, summary: value.summary } };
};

const parseQuizState = (value: unknown): Result<QuizState, string> => {
  if (!isRecord(value)) {
    return { ok: false, error: 'quiz must be an object' };
  }
  if (typeof value.currentQuestionId !== 'string') {
    return { ok: false, error: 'quiz currentQuestionId must be a string' };
  }
  if (!Array.isArray(value.selectedChoices)) {
    return { ok: false, error: 'quiz selectedChoices must be an array' };
  }
  const selectedChoices: QuizOption[] = [];
  for (const choice of value.selectedChoices) {
    const parsed = parseQuizOption(choice);
    if (!parsed.ok) {
      return { ok: false, error: parsed.error };
    }
    selectedChoices.push(parsed.value);
  }
  if (typeof value.isComplete !== 'boolean') {
    return { ok: false, error: 'quiz isComplete must be a boolean' };
  }
  let results: QuizResults | null = null;
  if (value.results !== null) {
    const parsedResults = parseQuizResults(value.results);
    if (!parsedResults.ok) {
      return { ok: false, error: parsedResults.error };
    }
    results = parsedResults.value;
  }
  return {
    ok: true,
    value: {
      currentQuestionId: value.currentQuestionId,
      selectedChoices,
      isComplete: value.isComplete,
      results,
    },
  };
};

const parseSettingsValue = (value: unknown): Result<SettingsValue, string> => {
  if (!isRecord(value)) {
    return { ok: false, error: 'settings value must be an object' };
  }
  if (!Array.isArray(value.workHours)) {
    return { ok: false, error: 'workHours must be an array' };
  }
  const themePreference = value.themePreference ?? 'system';
  if (!isThemePreference(themePreference)) {
    return { ok: false, error: 'themePreference must be system, light, or dark' };
  }
  const workHours: WorkHoursEntry[] = [];
  for (const entry of value.workHours) {
    const parsed = parseWorkHoursEntry(entry);
    if (!parsed.ok) {
      return { ok: false, error: parsed.error };
    }
    workHours.push(parsed.value);
  }
  if (!isStringArray(value.blockedSites)) {
    return { ok: false, error: 'blockedSites must be a string array' };
  }
  if (typeof value.hasOnboarded !== 'boolean') {
    return { ok: false, error: 'hasOnboarded must be a boolean' };
  }
  const quiz = parseQuizState(value.quiz);
  if (!quiz.ok) {
    return { ok: false, error: quiz.error };
  }
  return {
    ok: true,
    value: {
      themePreference,
      workHours,
      blockedSites: value.blockedSites,
      hasOnboarded: value.hasOnboarded,
      quiz: quiz.value,
    },
  };
};

export const settingsCodec: DocumentCodec<SettingsValue> = {
  schemaVersion: SETTINGS_SCHEMA_VERSION,

  createDefault(): VersionedDocument<SettingsValue> {
    return {
      schemaVersion: SETTINGS_SCHEMA_VERSION,
      revision: 0,
      value: createDefaultSettingsValue(),
    };
  },

  encode(document: VersionedDocument<SettingsValue>): unknown {
    return {
      schemaVersion: document.schemaVersion,
      revision: document.revision,
      value: document.value,
    };
  },

  decode(wire: unknown) {
    if (!isRecord(wire)) {
      return {
        ok: false as const,
        error: {
          kind: 'invalid-document' as const,
          message: 'Settings document must be an object',
        },
      };
    }
    if (typeof wire.schemaVersion !== 'number') {
      return {
        ok: false as const,
        error: {
          kind: 'invalid-field' as const,
          field: 'schemaVersion',
          message: 'schemaVersion must be a number',
        },
      };
    }
    if (wire.schemaVersion !== SETTINGS_SCHEMA_VERSION) {
      return {
        ok: false as const,
        error: {
          kind: 'unsupported-version' as const,
          message: `Unsupported Settings schema version ${wire.schemaVersion}`,
        },
      };
    }
    if (
      typeof wire.revision !== 'number' ||
      !Number.isInteger(wire.revision) ||
      wire.revision < 0
    ) {
      return {
        ok: false as const,
        error: {
          kind: 'invalid-field' as const,
          field: 'revision',
          message: 'revision must be a non-negative integer',
        },
      };
    }
    const value = parseSettingsValue(wire.value);
    if (!value.ok) {
      return {
        ok: false as const,
        error: {
          kind: 'invalid-field' as const,
          field: 'value',
          message: value.error,
        },
      };
    }
    return {
      ok: true as const,
      value: {
        schemaVersion: wire.schemaVersion,
        revision: wire.revision,
        value: value.value,
      },
    };
  },
};
