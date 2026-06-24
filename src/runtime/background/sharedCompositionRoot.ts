import type { KeyValueStorageAdapter } from '@/modules/persisted-application-state';
import {
  createBackgroundCompositionRoot,
  type BackgroundCompositionRoot,
} from './backgroundCompositionRoot';
import type { SettingsRuntimeError } from '../types';

type BackgroundCompositionRootResult =
  | { ok: true; value: BackgroundCompositionRoot }
  | { ok: false; error: SettingsRuntimeError };

let rootPromise: Promise<BackgroundCompositionRootResult> | null = null;
let rootAdapter: KeyValueStorageAdapter | null = null;

export const getSharedBackgroundCompositionRoot = (
  adapter: KeyValueStorageAdapter
): Promise<BackgroundCompositionRootResult> => {
  if (!rootPromise || rootAdapter !== adapter) {
    rootAdapter = adapter;
    rootPromise = createBackgroundCompositionRoot({ adapter });
  }
  return rootPromise;
};

export const resetSharedBackgroundCompositionRootForTests = (): void => {
  rootPromise = null;
  rootAdapter = null;
};
