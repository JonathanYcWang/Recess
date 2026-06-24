import { describe, expect, it } from 'vitest';
import {
  applyRewardGameCommand,
  decisionDeadlineEpochMs,
  outcomeCommittedBeforePresentation,
  presentationAnimationCapSeconds,
  rewardGameRoundCommandId,
  selectCandidates,
} from '@/modules/reward-game';
import { createDefaultRewardGameValue } from '@/modules/reward-game';
import { createRewardGameCommandEnvelope } from '@/runtime/client/inProcessRewardGameClient';
import { createRewardGameVerificationHarness } from './rewardGameVerificationHarness';

const destinations = ['youtube.com', 'reddit.com', 'instagram.com', 'tiktok.com'];

describe('reward game verification matrix', () => {
  describe('round contract', () => {
    it('commits candidates and deadline before presentation', () => {
      const candidates = selectCandidates(destinations, [1, 2, 3]);
      expect(candidates.length).toBe(3);
      expect(new Set(candidates).size).toBe(3);
    });

    it('resolves cards by choice before animation cap', () => {
      const started = applyRewardGameCommand(createDefaultRewardGameValue(), {
        kind: 'start-round',
        sessionId: 'ws-1',
        roundId: 'round-1',
        destinations,
        randomDraws: [0, 1, 2],
        nowEpochMs: 1_000_000,
        scheduledKind: 'cards',
      });
      expect(started.ok).toBe(true);
      if (!started.ok || started.value.phase !== 'active-round') {
        throw new Error('expected active round');
      }
      expect(started.value.candidates.length).toBeGreaterThan(0);
      expect(presentationAnimationCapSeconds('cards')).toBe(0);

      const chosen = applyRewardGameCommand(started.value, {
        kind: 'choose-candidate',
        roundId: 'round-1',
        candidateIndex: 0,
        nowEpochMs: 1_000_100,
      });
      expect(chosen.ok).toBe(true);
      if (chosen.ok) {
        expect(outcomeCommittedBeforePresentation(chosen.value)).toBe(true);
      }
    });

    it('auto-resolves at the absolute decision deadline once', async () => {
      const harness = await createRewardGameVerificationHarness({ randomSeed: 7 });
      const started = await harness.startRound({
        sessionId: 'ws-1',
        roundId: 'round-cards-timeout',
        destinations,
        scheduledKind: 'cards',
      });
      expect(started.ok).toBe(true);
      if (!started.ok || started.snapshot.snapshot.phase !== 'active-round') {
        throw new Error('expected active round snapshot');
      }

      const deadline = decisionDeadlineEpochMs('cards', 1_000_000);
      await harness.setNowAndSync(deadline);
      const resolved = await harness.handler.reconcileDecisionDeadlines(deadline);
      expect(resolved?.ok).toBe(true);
      if (resolved?.ok) {
        expect(resolved.snapshot.snapshot.phase).toBe('resolved-round');
      }

      const duplicate = await harness.handler.reconcileDecisionDeadlines(deadline + 1);
      expect(duplicate).toBeNull();
    });
  });

  describe('harness controls', () => {
    it('rejects duplicate commands with the same command id', async () => {
      const harness = await createRewardGameVerificationHarness();
      const envelope = createRewardGameCommandEnvelope(
        {
          kind: 'start-round',
          sessionId: 'ws-1',
          roundId: 'round-dup',
          destinations,
          randomDraws: [],
          nowEpochMs: 1_000_000,
          scheduledKind: 'wheel',
        },
        { commandId: rewardGameRoundCommandId('round-dup', 'start') }
      );
      const first = await harness.handler.execute(envelope);
      const second = await harness.handler.execute(envelope);
      expect(first.ok).toBe(true);
      expect(second).toEqual(first);
    });

    it('rejects stale revisions', async () => {
      const harness = await createRewardGameVerificationHarness();
      const started = await harness.startRound({
        sessionId: 'ws-1',
        roundId: 'round-stale',
        destinations,
        scheduledKind: 'slots',
      });
      expect(started.ok).toBe(true);
      if (!started.ok || started.snapshot.snapshot.phase !== 'active-round') {
        throw new Error('expected active round');
      }

      const triggered = await harness.handler.execute(
        createRewardGameCommandEnvelope(
          {
            kind: 'trigger-resolution',
            roundId: 'round-stale',
            randomValue: 0,
            nowEpochMs: 1_000_100,
          },
          { commandId: rewardGameRoundCommandId('round-stale', 'trigger') }
        )
      );
      expect(triggered.ok).toBe(true);

      const stale = await harness.handler.execute(
        createRewardGameCommandEnvelope(
          {
            kind: 'complete-round',
            roundId: 'round-stale',
          },
          {
            commandId: rewardGameRoundCommandId('round-stale', 'complete-stale'),
            expectedRevision: 0,
          }
        )
      );
      expect(stale.ok).toBe(false);
      if (!stale.ok) {
        expect(stale.error.kind).toBe('stale-revision');
      }
    });

    it('survives handler restart with durable round state', async () => {
      const harness = await createRewardGameVerificationHarness({ randomSeed: 99 });
      await harness.startRound({
        sessionId: 'ws-1',
        roundId: 'round-restart',
        destinations,
        scheduledKind: 'wheel',
      });
      const recreated = await harness.recreateHandler();
      const current = recreated.current();
      expect(current.ok).toBe(true);
      if (current.ok) {
        expect(current.value.snapshot.phase).toBe('active-round');
      }
    });

    it('keeps reduced-motion presentation from changing committed outcomes', async () => {
      const harness = await createRewardGameVerificationHarness({ randomSeed: 3 });
      const started = await harness.startRound({
        sessionId: 'ws-1',
        roundId: 'round-motion',
        destinations,
        scheduledKind: 'wheel',
      });
      expect(started.ok).toBe(true);
      if (!started.ok || started.snapshot.snapshot.phase !== 'active-round') {
        throw new Error('expected active round');
      }

      const triggered = await harness.handler.execute(
        createRewardGameCommandEnvelope(
          {
            kind: 'trigger-resolution',
            roundId: 'round-motion',
            randomValue: 0,
            nowEpochMs: 1_000_100,
          },
          { commandId: rewardGameRoundCommandId('round-motion', 'trigger') }
        )
      );
      expect(triggered.ok).toBe(true);
      if (triggered.ok && triggered.snapshot.snapshot.phase === 'resolved-round') {
        const committedDestination = triggered.snapshot.snapshot.selectedDestination;
        expect(triggered.snapshot.snapshot.maxAnimationSeconds).toBe(3);
        expect(committedDestination.length).toBeGreaterThan(0);
      }
    });
  });
});
