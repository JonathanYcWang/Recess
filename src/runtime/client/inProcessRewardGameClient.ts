import { RUNTIME_PROTOCOL_VERSION } from '@/runtime/protocol/types';
import type { RewardGameCommandEnvelope } from '@/runtime/protocol/rewardGameCommand';

export const createRewardGameCommandEnvelope = (
  command: RewardGameCommandEnvelope['command'],
  options: { commandId: string; expectedRevision?: number }
): RewardGameCommandEnvelope => ({
  protocolVersion: RUNTIME_PROTOCOL_VERSION,
  module: 'reward-game',
  commandId: options.commandId,
  expectedRevision: options.expectedRevision,
  command,
});
