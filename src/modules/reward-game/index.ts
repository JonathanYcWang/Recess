export {
  applyRewardGameCommand,
  outcomeCommittedBeforePresentation,
  presentationAnimationCapSeconds,
  reconstructRewardGameValue,
  rewardGameRoundCommandId,
  type RewardGameCommand,
  type RewardGameDecisionContext,
  type RewardGameDecisionError,
} from './decide';
export { selectCandidates, resolveDestination, normalizeDestinations } from './candidates';
export {
  decisionDeadlineEpochMs,
  decisionWindowSeconds,
  isDecisionDeadlineDue,
  maxAnimationSeconds,
  remainingDecisionSeconds,
} from './roundTiming';
export { projectRewardGameSnapshot, type RewardGameSnapshot } from './snapshot';
export {
  cloneRewardGameValue,
  createDefaultRewardGameValue,
  FREE_REROLLS_PER_ROUND,
  gameKindForIndex,
  MAX_CANDIDATES,
  PAID_REROLL_COST,
  type RewardGameActiveRound,
  type RewardGameIdle,
  type RewardGameResolutionKind,
  type RewardGameResolvedRound,
  type RewardGameValue,
} from './rewardGameDocument';
export { rewardGameCodec, REWARD_GAME_SCHEMA_VERSION } from './rewardGameCodec';
