import type { VersionedDocument } from '@/modules/persisted-application-state';
import type { RewardGameValue, RewardGameSnapshot } from '@/modules/reward-game';
import type { RewardGameCommandError } from './protocol/rewardGameCommand';
import type { RuntimeCommandResponse } from './protocol/types';

export type RewardGameDocumentSnapshot = VersionedDocument<RewardGameValue>;

export type RewardGamePublishedSnapshot = {
  revision: number;
  snapshot: RewardGameSnapshot;
};

export type RewardGameCommandResponse = RuntimeCommandResponse<
  RewardGamePublishedSnapshot,
  RewardGameCommandError
>;

export type RewardGameRuntimeResult =
  | { ok: true; value: RewardGamePublishedSnapshot }
  | { ok: false; error: RewardGameCommandError };

export interface RewardGameCommandHandler {
  current(): RewardGameRuntimeResult;
  execute(envelope: unknown): Promise<RewardGameCommandResponse>;
  subscribe(listener: (snapshot: RewardGamePublishedSnapshot) => void): () => void;
  reconcileDecisionDeadlines(nowEpochMs?: number): Promise<RewardGameCommandResponse | null>;
}
