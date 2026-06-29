import { createInMemoryKeyValueAdapter } from '@/adapters/browser/in-memory/inMemoryKeyValueAdapter';
import {
  createPersistedApplicationState,
  type PersistedApplicationState,
  type VersionedDocument,
} from '@/runtime/persistence';
import { rewardGameRoundCommandId, type RewardGameValue } from '@/modules/reward-game';
import { createFixedClock } from '@/runtime/clock';
import { createCommandOutcomeStore } from '@/runtime/commandOutcomeStore';
import { createRewardGameCommandHandler } from '@/runtime/background/rewardGameCommandHandler';
import { createRewardGameCommandEnvelope } from '@/runtime/client/inProcessRewardGameClient';
import type {
  RewardGameCommandHandler,
  RewardGameCommandResponse,
} from '@/runtime/rewardGameTypes';
import { createSeededRandomSource, type RandomSource } from '@/runtime/randomSource';

export interface RewardGameVerificationHarness {
  adapter: ReturnType<typeof createInMemoryKeyValueAdapter>;
  persistence: PersistedApplicationState;
  handler: RewardGameCommandHandler;
  randomSource: RandomSource;
  setNow(epochMs: number): void;
  setNowAndSync(epochMs: number): Promise<void>;
  setRandomSeed(seed: number): void;
  recreateHandler(): Promise<RewardGameCommandHandler>;
  startRound(options: {
    sessionId: string;
    roundId: string;
    destinations: string[];
    scheduledKind?: 'cards' | 'wheel' | 'slots';
  }): Promise<RewardGameCommandResponse>;
}

export const createRewardGameVerificationHarness = async (options?: {
  nowEpochMs?: number;
  randomSeed?: number;
}): Promise<RewardGameVerificationHarness> => {
  let nowEpochMs = options?.nowEpochMs ?? 1_000_000;
  let randomSource = createSeededRandomSource(options?.randomSeed ?? 42);
  const adapter = createInMemoryKeyValueAdapter();
  const persistence = createPersistedApplicationState({ adapter });
  const initialized = await persistence.initialize();
  if (!initialized.ok) {
    throw new Error('expected persistence initialization');
  }

  const loadDocument = async (): Promise<VersionedDocument<RewardGameValue>> => {
    const latest = await persistence.initialize();
    if (!latest.ok) {
      throw new Error('expected persistence reload');
    }
    return latest.value.documents['reward-game'];
  };

  const buildHandler = (document: VersionedDocument<RewardGameValue>) =>
    createRewardGameCommandHandler(persistence, document, {
      clock: createFixedClock(nowEpochMs),
      randomSource,
      outcomeStore: createCommandOutcomeStore<RewardGameCommandResponse>(adapter),
    });

  let handler = buildHandler(await loadDocument());

  const syncHandler = async (): Promise<RewardGameCommandHandler> => {
    handler = buildHandler(await loadDocument());
    return handler;
  };

  return {
    adapter,
    persistence,
    get handler() {
      return handler;
    },
    get randomSource() {
      return randomSource;
    },
    setNow(epochMs: number) {
      nowEpochMs = epochMs;
    },
    async setNowAndSync(epochMs: number) {
      nowEpochMs = epochMs;
      handler = await syncHandler();
    },
    setRandomSeed(seed: number) {
      randomSource = createSeededRandomSource(seed);
      void syncHandler();
    },
    recreateHandler: syncHandler,
    async startRound(startOptions) {
      handler = await syncHandler();
      return handler.execute(
        createRewardGameCommandEnvelope(
          {
            kind: 'start-round',
            sessionId: startOptions.sessionId,
            roundId: startOptions.roundId,
            destinations: startOptions.destinations,
            randomDraws: [],
            nowEpochMs,
            scheduledKind: startOptions.scheduledKind,
          },
          { commandId: rewardGameRoundCommandId(startOptions.roundId, 'start') }
        )
      );
    },
  };
};
