import {
  createDiagnosticRingBuffer,
  createPersistedApplicationState,
  type KeyValueStorageAdapter,
} from '@/modules/persisted-application-state';
import { createInProcessSettingsClient } from '../client/inProcessSettingsClient';
import { createInProcessBlockListClient } from '../client/inProcessBlockListClient';
import { createInProcessWorkstyleProfileClient } from '../client/inProcessWorkstyleProfileClient';
import { createInProcessCoinClient } from '../client/inProcessCoinClient';
import { createCommandOutcomeStore } from '../commandOutcomeStore';
import type {
  BlockListClient,
  BlockListCommandHandler,
  BlockListCommandResponse,
} from '../blockListTypes';
import type {
  SettingsClient,
  SettingsCommandHandler,
  SettingsCommandResponse,
  SettingsRuntimeError,
} from '../types';
import type {
  WorkstyleProfileClient,
  WorkstyleProfileCommandHandler,
  WorkstyleProfileCommandResponse,
} from '../workstyleProfileTypes';
import type { CoinClient, CoinCommandHandler, CoinCommandResponse } from '../coinTypes';
import { createBlockListCommandHandler } from './blockListCommandHandler';
import { createSettingsCommandHandler } from './settingsCommandHandler';
import { createWorkstyleProfileCommandHandler } from './workstyleProfileCommandHandler';
import { createCoinCommandHandler } from './coinCommandHandler';

export interface BackgroundCompositionRoot {
  settings: SettingsClient;
  blockList: BlockListClient;
  workstyleProfile: WorkstyleProfileClient;
  coin: CoinClient;
  settingsHandler: SettingsCommandHandler;
  blockListHandler: BlockListCommandHandler;
  workstyleProfileHandler: WorkstyleProfileCommandHandler;
  coinHandler: CoinCommandHandler;
}

type BackgroundCompositionRootResult =
  | { ok: true; value: BackgroundCompositionRoot }
  | { ok: false; error: SettingsRuntimeError };

export const createBackgroundCompositionRoot = async (options: {
  adapter: KeyValueStorageAdapter;
}): Promise<BackgroundCompositionRootResult> => {
  const diagnostics = createDiagnosticRingBuffer();
  const persistence = createPersistedApplicationState({ adapter: options.adapter, diagnostics });
  const initialized = await persistence.initialize();
  if (!initialized.ok) {
    return { ok: false, error: { kind: 'persistence-unavailable' } };
  }

  const settingsOutcomeStore = createCommandOutcomeStore<SettingsCommandResponse>(options.adapter);
  const blockListOutcomeStore = createCommandOutcomeStore<BlockListCommandResponse>(
    options.adapter
  );
  const workstyleProfileOutcomeStore = createCommandOutcomeStore<WorkstyleProfileCommandResponse>(
    options.adapter
  );
  const coinOutcomeStore = createCommandOutcomeStore<CoinCommandResponse>(options.adapter);
  const settingsHandler = createSettingsCommandHandler(
    persistence,
    initialized.value.documents.settings,
    { diagnostics, outcomeStore: settingsOutcomeStore }
  );
  const blockListHandler = createBlockListCommandHandler(
    persistence,
    initialized.value.documents['block-list'],
    { adapter: options.adapter, diagnostics, outcomeStore: blockListOutcomeStore }
  );
  const workstyleProfileHandler = createWorkstyleProfileCommandHandler(
    persistence,
    initialized.value.documents['workstyle-profile'],
    { diagnostics, outcomeStore: workstyleProfileOutcomeStore }
  );
  const coinHandler = createCoinCommandHandler(persistence, initialized.value.documents.coin, {
    diagnostics,
    outcomeStore: coinOutcomeStore,
  });

  return {
    ok: true,
    value: {
      settings: createInProcessSettingsClient(settingsHandler),
      blockList: createInProcessBlockListClient(blockListHandler),
      workstyleProfile: createInProcessWorkstyleProfileClient(workstyleProfileHandler),
      coin: createInProcessCoinClient(coinHandler),
      settingsHandler,
      blockListHandler,
      workstyleProfileHandler,
      coinHandler,
    },
  };
};
