import type {
  DocumentCodec,
  PersistedDocumentName,
  PersistedDocuments,
  VersionedDocument,
} from '../types';
import { blockListCodec } from '@/modules/block-list';
import { workstyleProfileCodec } from '@/modules/workstyle-profile';
import { coinCodec } from '@/modules/coin';
import { settingsCodec } from '../settings/settingsCodec';
import type { SettingsValue } from '../settings/settingsDocument';
import { createDefaultSettingsValue } from '../settings/settingsDocument';
import type { BlockListValue } from '@/modules/block-list';
import type { WorkstyleProfileValue } from '@/modules/workstyle-profile';
import type { CoinLedgerValue } from '@/modules/coin';
import { workRhythmCodec } from '@/modules/work-rhythm';
import type { WorkRhythmValue } from '@/modules/work-rhythm';
import { rewardGameCodec } from '@/modules/reward-game';
import type { RewardGameValue } from '@/modules/reward-game';
import { hallPassCodec } from '@/modules/hall-pass';
import type { HallPassValue } from '@/modules/hall-pass';
import { workStartReminderCodec } from '@/modules/work-start-reminder';
import type { WorkStartReminderValue } from '@/modules/work-start-reminder';
import { workSessionStreakCodec } from '@/modules/work-session-streak';
import type { WorkSessionStreakValue } from '@/modules/work-session-streak';
import { taskListCodec } from '@/modules/task-list';
import type { TaskListValue } from '@/modules/task-list';

export const SETTINGS_DOCUMENT_KEY = '__recess_doc_settings';
export const BLOCK_LIST_DOCUMENT_KEY = '__recess_doc_block_list';
export const WORKSTYLE_PROFILE_DOCUMENT_KEY = '__recess_doc_workstyle_profile';
export const COIN_DOCUMENT_KEY = '__recess_doc_coin';
export const WORK_RHYTHM_DOCUMENT_KEY = '__recess_doc_work_rhythm';
export const REWARD_GAME_DOCUMENT_KEY = '__recess_doc_reward_game';
export const HALL_PASS_DOCUMENT_KEY = '__recess_doc_hall_pass';
export const WORK_START_REMINDER_DOCUMENT_KEY = '__recess_doc_work_start_reminder';
export const WORK_SESSION_STREAK_DOCUMENT_KEY = '__recess_doc_work_session_streak';
export const TASK_LIST_DOCUMENT_KEY = '__recess_doc_task_list';

export interface DocumentRegistryEntry<T> {
  document: PersistedDocumentName;
  storageKey: string;
  codec: DocumentCodec<T>;
  createDefault: () => VersionedDocument<T>;
}

export const documentRegistry = {
  settings: {
    document: 'settings',
    storageKey: SETTINGS_DOCUMENT_KEY,
    codec: settingsCodec,
    createDefault: () => settingsCodec.createDefault(),
  },
  'block-list': {
    document: 'block-list',
    storageKey: BLOCK_LIST_DOCUMENT_KEY,
    codec: blockListCodec,
    createDefault: () => blockListCodec.createDefault(),
  },
  'workstyle-profile': {
    document: 'workstyle-profile',
    storageKey: WORKSTYLE_PROFILE_DOCUMENT_KEY,
    codec: workstyleProfileCodec,
    createDefault: () => workstyleProfileCodec.createDefault(),
  },
  coin: {
    document: 'coin',
    storageKey: COIN_DOCUMENT_KEY,
    codec: coinCodec,
    createDefault: () => coinCodec.createDefault(),
  },
  'work-rhythm': {
    document: 'work-rhythm',
    storageKey: WORK_RHYTHM_DOCUMENT_KEY,
    codec: workRhythmCodec,
    createDefault: () => workRhythmCodec.createDefault(),
  },
  'reward-game': {
    document: 'reward-game',
    storageKey: REWARD_GAME_DOCUMENT_KEY,
    codec: rewardGameCodec,
    createDefault: () => rewardGameCodec.createDefault(),
  },
  'hall-pass': {
    document: 'hall-pass',
    storageKey: HALL_PASS_DOCUMENT_KEY,
    codec: hallPassCodec,
    createDefault: () => hallPassCodec.createDefault(),
  },
  'work-start-reminder': {
    document: 'work-start-reminder',
    storageKey: WORK_START_REMINDER_DOCUMENT_KEY,
    codec: workStartReminderCodec,
    createDefault: () => workStartReminderCodec.createDefault(),
  },
  'work-session-streak': {
    document: 'work-session-streak',
    storageKey: WORK_SESSION_STREAK_DOCUMENT_KEY,
    codec: workSessionStreakCodec,
    createDefault: () => workSessionStreakCodec.createDefault(),
  },
  'task-list': {
    document: 'task-list',
    storageKey: TASK_LIST_DOCUMENT_KEY,
    codec: taskListCodec,
    createDefault: () => taskListCodec.createDefault(),
  },
} as const satisfies {
  settings: DocumentRegistryEntry<SettingsValue>;
  'block-list': DocumentRegistryEntry<BlockListValue>;
  'workstyle-profile': DocumentRegistryEntry<WorkstyleProfileValue>;
  coin: DocumentRegistryEntry<CoinLedgerValue>;
  'work-rhythm': DocumentRegistryEntry<WorkRhythmValue>;
  'reward-game': DocumentRegistryEntry<RewardGameValue>;
  'hall-pass': DocumentRegistryEntry<HallPassValue>;
  'work-start-reminder': DocumentRegistryEntry<WorkStartReminderValue>;
  'work-session-streak': DocumentRegistryEntry<WorkSessionStreakValue>;
  'task-list': DocumentRegistryEntry<TaskListValue>;
};

export const registeredDocumentNames = [
  'settings',
  'block-list',
  'workstyle-profile',
  'coin',
  'work-rhythm',
  'reward-game',
  'hall-pass',
  'work-start-reminder',
  'work-session-streak',
  'task-list',
] as const satisfies readonly PersistedDocumentName[];

export const allOperationalStorageKeys = (): string[] =>
  registeredDocumentNames.map((name) => documentRegistry[name].storageKey);

export const createDefaultDocument = <K extends PersistedDocumentName>(
  name: K
): VersionedDocument<PersistedDocuments[K]> =>
  documentRegistry[name].createDefault() as VersionedDocument<PersistedDocuments[K]>;

export { createDefaultSettingsValue };
