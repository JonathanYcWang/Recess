import { describe, expect, it } from 'vitest';
import {
  applyRewardGameCommand,
  createDefaultRewardGameValue,
  resolveDestination,
  selectCandidates,
  type RewardGameValue,
} from '@/modules/reward-game';

describe('reward game candidates', () => {
  it('selects up to three unique destinations', () => {
    const candidates = selectCandidates(['youtube.com', 'reddit.com', 'instagram.com'], [0, 0, 0]);
    expect(candidates).toHaveLength(3);
    expect(new Set(candidates).size).toBe(3);
  });

  it('shows one or two candidates when fewer than three exist', () => {
    expect(selectCandidates(['youtube.com'], [0])).toEqual(['youtube.com']);
    expect(selectCandidates(['youtube.com', 'reddit.com'], [0, 0])).toHaveLength(2);
  });

  it('resolves deterministic timeout outcomes', () => {
    const candidates = ['a.com', 'b.com', 'c.com'];
    expect(resolveDestination(candidates, 'timeout', { randomValue: 1 })).toBe('b.com');
    expect(resolveDestination(candidates, 'choice', { choiceIndex: 2, randomValue: 0 })).toBe(
      'c.com'
    );
  });
});

describe('reward game decide', () => {
  it('rejects repeated card choices after resolution', () => {
    let value: RewardGameValue = createDefaultRewardGameValue();
    const start = applyRewardGameCommand(value, {
      kind: 'start-round',
      sessionId: 's',
      roundId: 'r',
      destinations: ['youtube.com', 'reddit.com', 'instagram.com'],
      randomDraws: [1, 2, 0],
      nowEpochMs: 1000,
      scheduledKind: 'cards',
    });
    if (!start.ok) {
      throw new Error('start failed');
    }
    value = start.value;
    const first = applyRewardGameCommand(value, {
      kind: 'choose-candidate',
      roundId: 'r',
      candidateIndex: 0,
      nowEpochMs: 1100,
    });
    if (!first.ok) {
      throw new Error('choose failed');
    }
    value = first.value;
    const second = applyRewardGameCommand(value, {
      kind: 'choose-candidate',
      roundId: 'r',
      candidateIndex: 1,
      nowEpochMs: 1200,
    });
    expect(second.ok).toBe(false);
  });
});
