import { describe, expect, it } from 'vitest';
import {
  applyRewardGameCommand,
  createDefaultRewardGameValue,
  decisionDeadlineEpochMs,
  decisionWindowSeconds,
  maxAnimationSeconds,
  presentationAnimationCapSeconds,
  selectCandidates,
} from '@/modules/reward-game';

const destinations = ['youtube.com', 'reddit.com', 'instagram.com'];

describe('play cards', () => {
  it('uses a ten-second decision window and zero animation budget', () => {
    expect(decisionWindowSeconds('cards')).toBe(10);
    expect(maxAnimationSeconds('cards')).toBe(0);
    expect(presentationAnimationCapSeconds('cards')).toBe(0);
  });

  it('presents one to three unique destinations', () => {
    expect(selectCandidates(['youtube.com'], [0])).toEqual(['youtube.com']);
    expect(selectCandidates(['youtube.com', 'reddit.com'], [0, 0])).toHaveLength(2);
    expect(selectCandidates(destinations, [0, 1, 2])).toHaveLength(3);
  });

  it('commits exactly one destination on card choice', () => {
    const started = applyRewardGameCommand(createDefaultRewardGameValue(), {
      kind: 'start-round',
      sessionId: 'ws',
      roundId: 'cards-1',
      destinations,
      randomDraws: [0, 1, 2],
      nowEpochMs: 1_000,
      scheduledKind: 'cards',
    });
    if (!started.ok || started.value.phase !== 'active-round') {
      throw new Error('expected active cards round');
    }
    const chosen = applyRewardGameCommand(started.value, {
      kind: 'choose-candidate',
      roundId: 'cards-1',
      candidateIndex: 1,
      nowEpochMs: 1_100,
    });
    expect(chosen.ok).toBe(true);
    if (chosen.ok && chosen.value.phase === 'resolved-round') {
      expect(chosen.value.selectedDestination).toBe(started.value.candidates[1]);
    }
  });

  it('auto-selects once at the absolute deadline', () => {
    const started = applyRewardGameCommand(createDefaultRewardGameValue(), {
      kind: 'start-round',
      sessionId: 'ws',
      roundId: 'cards-timeout',
      destinations,
      randomDraws: [1, 0, 2],
      nowEpochMs: 1_000,
      scheduledKind: 'cards',
    });
    if (!started.ok || started.value.phase !== 'active-round') {
      throw new Error('expected active cards round');
    }
    const deadline = decisionDeadlineEpochMs('cards', 1_000);
    const resolved = applyRewardGameCommand(started.value, {
      kind: 'resolve-deadline',
      roundId: 'cards-timeout',
      randomValue: 0,
      nowEpochMs: deadline,
    });
    expect(resolved.ok).toBe(true);
  });
});

describe('play wheel', () => {
  it('uses a five-second decision window and three-second animation cap', () => {
    expect(decisionWindowSeconds('wheel')).toBe(5);
    expect(maxAnimationSeconds('wheel')).toBe(3);
  });

  it('commits outcome on user trigger before animation', () => {
    const started = applyRewardGameCommand(createDefaultRewardGameValue(), {
      kind: 'start-round',
      sessionId: 'ws',
      roundId: 'wheel-1',
      destinations,
      randomDraws: [0, 1, 2],
      nowEpochMs: 2_000,
      scheduledKind: 'wheel',
    });
    if (!started.ok || started.value.phase !== 'active-round') {
      throw new Error('expected active wheel round');
    }
    const triggered = applyRewardGameCommand(started.value, {
      kind: 'trigger-resolution',
      roundId: 'wheel-1',
      randomValue: 2,
      nowEpochMs: 2_100,
    });
    expect(triggered.ok).toBe(true);
    if (triggered.ok && triggered.value.phase === 'resolved-round') {
      expect(triggered.value.resolutionKind).toBe('trigger');
      expect(triggered.value.selectedDestination.length).toBeGreaterThan(0);
    }
  });
});

describe('play slots', () => {
  it('uses a five-second decision window and three-second animation cap', () => {
    expect(decisionWindowSeconds('slots')).toBe(5);
    expect(maxAnimationSeconds('slots')).toBe(3);
  });

  it('commits outcome on timeout before reel presentation', () => {
    const started = applyRewardGameCommand(createDefaultRewardGameValue(), {
      kind: 'start-round',
      sessionId: 'ws',
      roundId: 'slots-1',
      destinations,
      randomDraws: [2, 1, 0],
      nowEpochMs: 3_000,
      scheduledKind: 'slots',
    });
    if (!started.ok || started.value.phase !== 'active-round') {
      throw new Error('expected active slots round');
    }
    const resolved = applyRewardGameCommand(started.value, {
      kind: 'resolve-deadline',
      roundId: 'slots-1',
      randomValue: 1,
      nowEpochMs: started.value.decisionDeadlineEpochMs,
    });
    expect(resolved.ok).toBe(true);
    if (resolved.ok && resolved.value.phase === 'resolved-round') {
      expect(resolved.value.resolutionKind).toBe('timeout');
    }
  });
});
