import { describe, expect, it } from 'vitest';
import {
  applyRewardGameCommand,
  createDefaultRewardGameValue,
  FREE_REROLLS_PER_ROUND,
  gameKindForIndex,
  PAID_REROLL_COST,
  rewardGameRoundCommandId,
  type RewardGameValue,
} from '@/modules/reward-game';
import {
  decideAcceptRecess,
  decideCompleteCountdown,
  decideCompleteRewardGame,
  decideEndRecess,
  type WorkRhythmRecessPrompt,
} from '@/modules/work-rhythm';
import { createRewardGameVerificationHarness } from './rewardGameVerificationHarness';

const destinations = ['youtube.com', 'reddit.com', 'instagram.com'];

const recessPrompt = (): WorkRhythmRecessPrompt => ({
  phase: 'recess-prompt',
  sessionId: 'ws-epic',
  originalGoalSeconds: 3 * 60 * 60,
  sessionStartedAtEpochMs: 1_000_000,
  settledRemainingWorkSessionSeconds: 2 * 60 * 60,
  energy: 'steady',
  momentum: 'steady',
  focusBlockStreak: 1,
  completedFocusBlockIndex: 0,
  lastSettledSegment: 0,
  deferredRecessCount: 1,
  originalGoalPermanentlyComplete: false,
  isWorkSessionExtension: false,
  extensionTrancheSeconds: 0,
  extensionBaselineCumulativeSeconds: 0,
  extensionBaselineCount: 0,
});

describe('reward game and recess epic integration', () => {
  it('rotates cards, wheel, and slots across completed rounds', async () => {
    let rewardGame: RewardGameValue = createDefaultRewardGameValue();
    const kinds: string[] = [];
    for (let i = 0; i < 3; i += 1) {
      const started = applyRewardGameCommand(rewardGame, {
        kind: 'start-round',
        sessionId: 'ws-epic',
        roundId: `round-${i}`,
        destinations,
        randomDraws: [i, i + 1, i + 2],
        nowEpochMs: 1_000_000 + i * 100_000,
      });
      if (!started.ok || started.value.phase !== 'active-round') {
        throw new Error('expected active round');
      }
      kinds.push(started.value.kind);
      const resolved = applyRewardGameCommand(started.value, {
        kind: 'resolve-deadline',
        roundId: `round-${i}`,
        randomValue: i,
        nowEpochMs: started.value.decisionDeadlineEpochMs,
      });
      if (!resolved.ok || resolved.value.phase !== 'resolved-round') {
        throw new Error('expected resolved round');
      }
      const completed = applyRewardGameCommand(resolved.value, {
        kind: 'complete-round',
        roundId: `round-${i}`,
      });
      if (!completed.ok) {
        throw new Error('expected idle after complete');
      }
      rewardGame = completed.value;
    }
    expect(kinds).toEqual(['cards', 'wheel', 'slots']);
    expect(rewardGame.phase === 'idle' && rewardGame.nextGameIndex).toBe(0);
  });

  it('skips reward game for an empty block list but still enters recess', () => {
    const accepted = decideAcceptRecess(recessPrompt(), {
      nowEpochMs: 1_001_000,
      preferredCadence: '25/5',
      blockListEntries: [],
      nextGameIndex: 0,
      roundId: 'unused',
      selectedTaskRemainingSeconds: null,
    });
    expect(accepted.ok).toBe(true);
    if (accepted.ok) {
      expect(accepted.value.skipRewardGame).toBe(true);
      expect(accepted.value.nextValue.phase).toBe('recess');
      if (accepted.value.nextValue.phase === 'recess') {
        expect(accepted.value.nextValue.recessPassDestination).toBeNull();
      }
    }
  });

  it('traces accept, play, recess, countdown, and next focus', async () => {
    const harness = await createRewardGameVerificationHarness({ randomSeed: 11 });
    const accepted = decideAcceptRecess(recessPrompt(), {
      nowEpochMs: 1_001_000,
      preferredCadence: '25/5',
      blockListEntries: destinations,
      nextGameIndex: 0,
      roundId: 'round-epic',
      selectedTaskRemainingSeconds: null,
    });
    if (!accepted.ok || accepted.value.nextValue.phase !== 'reward-game') {
      throw new Error('expected reward-game phase');
    }

    const started = await harness.startRound({
      sessionId: 'ws-epic',
      roundId: 'round-epic',
      destinations,
      scheduledKind: 'cards',
    });
    expect(started.ok).toBe(true);

    const chosen = await harness.handler.execute({
      protocolVersion: 1,
      module: 'reward-game',
      commandId: rewardGameRoundCommandId('round-epic', 'choose'),
      command: {
        kind: 'choose-candidate',
        roundId: 'round-epic',
        candidateIndex: 0,
        nowEpochMs: 1_001_100,
      },
    });
    expect(chosen.ok).toBe(true);
    if (!chosen.ok || chosen.snapshot.snapshot.phase !== 'resolved-round') {
      throw new Error('expected resolved reward game');
    }

    const completedGame = decideCompleteRewardGame(accepted.value.nextValue, {
      nowEpochMs: 1_001_200,
      preferredCadence: '25/5',
      selectedTaskRemainingSeconds: null,
      roundId: 'round-epic',
      selectedDestination: chosen.snapshot.snapshot.selectedDestination,
    });
    expect(completedGame.ok).toBe(true);
    if (!completedGame.ok) {
      throw new Error('expected recess transition');
    }

    const ended = decideEndRecess(completedGame.value.nextValue, {
      nowEpochMs: completedGame.value.nextValue.recessDeadlineAtEpochMs,
      preferredCadence: '25/5',
      selectedTaskRemainingSeconds: null,
      nextGameIndex: 1,
      early: false,
    });
    expect(ended.ok).toBe(true);
    if (!ended.ok || ended.value.nextValue.phase !== 'back-to-work-countdown') {
      throw new Error('expected countdown');
    }

    const nextFocus = decideCompleteCountdown(ended.value.nextValue, {
      nowEpochMs: ended.value.nextValue.countdownDeadlineAtEpochMs,
      preferredCadence: '25/5',
      selectedTaskRemainingSeconds: null,
      nextGameIndex: 1,
    });
    expect(nextFocus.ok).toBe(true);
    if (nextFocus.ok) {
      expect(nextFocus.value.nextValue.phase).toBe('focus-block');
      expect(gameKindForIndex(1)).toBe('wheel');
    }
  });

  it('enforces free and paid reroll boundaries', () => {
    let value: RewardGameValue = createDefaultRewardGameValue();
    const start = applyRewardGameCommand(value, {
      kind: 'start-round',
      sessionId: 'ws',
      roundId: 'r',
      destinations,
      randomDraws: [1, 2, 0],
      nowEpochMs: 1000,
      scheduledKind: 'wheel',
    });
    if (!start.ok) {
      throw new Error('start failed');
    }
    const triggered = applyRewardGameCommand(start.value, {
      kind: 'trigger-resolution',
      roundId: 'r',
      randomValue: 1,
      nowEpochMs: 1100,
    });
    if (!triggered.ok || triggered.value.phase !== 'resolved-round') {
      throw new Error('expected resolved round');
    }
    value = triggered.value;

    for (let i = 0; i < FREE_REROLLS_PER_ROUND; i += 1) {
      const rerolled = applyRewardGameCommand(value, {
        kind: 'reroll',
        roundId: 'r',
        destinations,
        randomDraws: [i + 3],
        nowEpochMs: 2000 + i * 1000,
        coinBalance: 100,
        paid: false,
        remainingRecessBudgetSeconds: 30 * 60,
      });
      expect(rerolled.ok).toBe(true);
      if (rerolled.ok && rerolled.value.phase === 'active-round') {
        const resolved = applyRewardGameCommand(rerolled.value, {
          kind: 'trigger-resolution',
          roundId: 'r',
          randomValue: i,
          nowEpochMs: rerolled.value.decisionDeadlineEpochMs - 1000,
        });
        if (!resolved.ok || resolved.value.phase !== 'resolved-round') {
          throw new Error('expected resolved reroll');
        }
        value = resolved.value;
      }
    }

    const paid = applyRewardGameCommand(value, {
      kind: 'reroll',
      roundId: 'r',
      destinations,
      randomDraws: [9],
      nowEpochMs: 9000,
      coinBalance: PAID_REROLL_COST,
      paid: true,
      remainingRecessBudgetSeconds: 30 * 60,
    });
    expect(paid.ok).toBe(true);

    const broke = applyRewardGameCommand(value, {
      kind: 'reroll',
      roundId: 'r',
      destinations,
      randomDraws: [10],
      nowEpochMs: 10_000,
      coinBalance: PAID_REROLL_COST - 1,
      paid: true,
      remainingRecessBudgetSeconds: 30 * 60,
    });
    expect(broke.ok).toBe(false);
  });
});
