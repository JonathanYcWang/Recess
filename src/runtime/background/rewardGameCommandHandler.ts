import type { PersistedApplicationState, VersionedDocument } from '@/runtime/persistence';
import {
  applyRewardGameCommand,
  cloneRewardGameValue,
  isDecisionDeadlineDue,
  projectRewardGameSnapshot,
  rewardGameRoundCommandId,
  type RewardGameValue,
} from '@/modules/reward-game';
import type { Clock } from '../clock';
import type { RandomSource } from '../randomSource';
import { createCommandLedger } from '../commandLedger';
import type { CommandOutcomeStore } from '../commandOutcomeStore';
import {
  decodeRewardGameCommandEnvelope,
  type RewardGameCommandEnvelope,
  type RewardGameCommandError,
} from '../protocol/rewardGameCommand';
import type {
  RewardGameCommandHandler,
  RewardGameCommandResponse,
  RewardGamePublishedSnapshot,
  RewardGameRuntimeResult,
} from '../rewardGameTypes';

const clonePublishedSnapshot = (
  snapshot: RewardGamePublishedSnapshot
): RewardGamePublishedSnapshot => ({
  revision: snapshot.revision,
  snapshot:
    snapshot.snapshot.phase === 'idle'
      ? { ...snapshot.snapshot }
      : snapshot.snapshot.phase === 'active-round'
        ? {
            ...snapshot.snapshot,
            candidates: [...snapshot.snapshot.candidates],
          }
        : {
            ...snapshot.snapshot,
            candidates: [...snapshot.snapshot.candidates],
          },
});

const toSuccess = (
  document: VersionedDocument<RewardGameValue>,
  nowEpochMs: number
): RewardGameCommandResponse => ({
  ok: true,
  revision: document.revision,
  snapshot: clonePublishedSnapshot({
    revision: document.revision,
    snapshot: projectRewardGameSnapshot(document.value, nowEpochMs),
  }),
});

const toFailure = (error: RewardGameCommandError): RewardGameCommandResponse => ({
  ok: false,
  error,
});

export const createRewardGameCommandHandler = (
  persistence: PersistedApplicationState,
  initialized: VersionedDocument<RewardGameValue>,
  options: {
    clock: Clock;
    randomSource: RandomSource;
    outcomeStore?: CommandOutcomeStore<RewardGameCommandResponse>;
  }
): RewardGameCommandHandler => {
  let document = {
    ...initialized,
    value: cloneRewardGameValue(initialized.value),
  };
  const ledger = createCommandLedger<RewardGameCommandResponse>();
  const { clock, randomSource, outcomeStore } = options;
  const listeners = new Set<(snapshot: RewardGamePublishedSnapshot) => void>();

  const hydrateLedgerFromStore = async (): Promise<void> => {
    if (!outcomeStore) {
      return;
    }
    const stored = await outcomeStore.list('reward-game');
    for (const entry of stored) {
      ledger.set(entry.commandId, entry.response);
    }
  };
  void hydrateLedgerFromStore();

  const publish = (nowEpochMs: number): RewardGamePublishedSnapshot => ({
    revision: document.revision,
    snapshot: projectRewardGameSnapshot(document.value, nowEpochMs),
  });

  const notifyListeners = (nowEpochMs: number) => {
    const snapshot = clonePublishedSnapshot(publish(nowEpochMs));
    for (const listener of listeners) {
      listener(snapshot);
    }
  };

  const recordUnexpected = (): RewardGameCommandResponse =>
    toFailure({ kind: 'unexpected-runtime' });

  const drawValues = (count: number): number[] => {
    const draws: number[] = [];
    for (let i = 0; i < count; i += 1) {
      draws.push(randomSource.randomUint32());
    }
    return draws;
  };

  const enrichCommand = (
    command: RewardGameCommandEnvelope['command']
  ): RewardGameCommandEnvelope['command'] => {
    const nowEpochMs = clock.nowEpochMs();
    if (command.kind === 'start-round') {
      return {
        ...command,
        nowEpochMs,
        randomDraws: drawValues(3),
      };
    }
    if (command.kind === 'trigger-resolution' || command.kind === 'resolve-deadline') {
      return {
        ...command,
        nowEpochMs,
        randomValue: randomSource.randomUint32(),
      };
    }
    if (command.kind === 'choose-candidate') {
      return { ...command, nowEpochMs };
    }
    if (command.kind === 'reroll') {
      return {
        ...command,
        nowEpochMs,
        randomDraws: drawValues(3),
      };
    }
    return command;
  };

  const executeFresh = async (
    envelope: RewardGameCommandEnvelope
  ): Promise<RewardGameCommandResponse> => {
    if (
      envelope.expectedRevision !== undefined &&
      envelope.expectedRevision !== document.revision
    ) {
      return toFailure({
        kind: 'stale-revision',
        expectedRevision: envelope.expectedRevision,
        actualRevision: document.revision,
      });
    }

    const command = enrichCommand(envelope.command);
    const decided = applyRewardGameCommand(document.value, command);
    if (!decided.ok) {
      return toFailure(decided.error);
    }

    const committed = await persistence.commit([
      {
        document: 'reward-game',
        expectedRevision: document.revision,
        value: decided.value,
      },
    ]);
    if (!committed.ok) {
      if (committed.error.kind === 'conflict') {
        return toFailure({
          kind: 'stale-revision',
          expectedRevision: document.revision,
          actualRevision: committed.error.actualRevision,
        });
      }
      return toFailure({ kind: 'persistence-failed' });
    }

    const rewardGame = committed.value.documents['reward-game'];
    if (!rewardGame) {
      return toFailure({ kind: 'persistence-failed' });
    }
    document = {
      ...rewardGame,
      value: cloneRewardGameValue(rewardGame.value),
    };
    const nowEpochMs = clock.nowEpochMs();
    notifyListeners(nowEpochMs);
    return toSuccess(document, nowEpochMs);
  };

  return {
    current(): RewardGameRuntimeResult {
      const nowEpochMs = clock.nowEpochMs();
      return {
        ok: true,
        value: clonePublishedSnapshot(publish(nowEpochMs)),
      };
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    async execute(envelopeInput: unknown): Promise<RewardGameCommandResponse> {
      const decoded = decodeRewardGameCommandEnvelope(envelopeInput);
      if (!decoded.ok) {
        return toFailure(decoded.error);
      }
      const envelope = decoded.value;

      const cached = ledger.get(envelope.commandId);
      if (cached) {
        return cached;
      }
      if (outcomeStore) {
        const stored = await outcomeStore.get('reward-game', envelope.commandId);
        if (stored) {
          ledger.set(envelope.commandId, stored);
          return stored;
        }
      }

      try {
        const response = await executeFresh(envelope);
        ledger.set(envelope.commandId, response);
        if (outcomeStore) {
          await outcomeStore.set('reward-game', envelope.commandId, response);
        }
        return response;
      } catch {
        const response = recordUnexpected();
        ledger.set(envelope.commandId, response);
        if (outcomeStore) {
          await outcomeStore.set('reward-game', envelope.commandId, response);
        }
        return response;
      }
    },

    async reconcileDecisionDeadlines(nowEpochMs = clock.nowEpochMs()) {
      if (document.value.phase !== 'active-round') {
        return null;
      }
      if (!isDecisionDeadlineDue(document.value.decisionDeadlineEpochMs, nowEpochMs)) {
        return null;
      }
      return this.execute({
        protocolVersion: 1,
        module: 'reward-game',
        commandId: rewardGameRoundCommandId(document.value.roundId, 'deadline'),
        command: {
          kind: 'resolve-deadline',
          roundId: document.value.roundId,
          randomValue: 0,
          nowEpochMs,
        },
      });
    },
  };
};
