import { afterEach, describe, expect, it, vi } from 'vitest';
import { MAX_REWARD_GENERATION_RETRIES } from '../constants/constants';
import { generateReward } from './rewardService';

vi.mock('./sessionDurationService', () => ({
  calculateBreakDuration: vi.fn(),
}));

describe('rewardService', async () => {
  const { calculateBreakDuration } = await import('./sessionDurationService');
  const mockedCalculateBreakDuration = vi.mocked(calculateBreakDuration);

  afterEach(() => {
    vi.restoreAllMocks();
    mockedCalculateBreakDuration.mockReset();
  });

  it('generates a reward for an unseen site-duration combination and records it as shown', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.25);
    mockedCalculateBreakDuration.mockReturnValue(600);
    const shownCombinations: string[] = [];

    const reward = generateReward(['youtube.com', 'reddit.com'], shownCombinations, 25, 0.75);

    expect(reward).toEqual({
      id: 'youtube.com-600',
      name: 'youtube.com',
      duration: 600,
    });
    expect(shownCombinations).toEqual(['youtube.com-600']);
    expect(mockedCalculateBreakDuration).toHaveBeenCalledWith(25, 0.75);
  });

  it('retries when a generated combination has already been shown', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    mockedCalculateBreakDuration.mockReturnValueOnce(300).mockReturnValueOnce(600);
    const shownCombinations = ['news.example-300'];

    const reward = generateReward(['news.example'], shownCombinations, 70, 0.2);

    expect(reward.id).toBe('news.example-600');
    expect(shownCombinations).toEqual(['news.example-300', 'news.example-600']);
  });

  it('falls back to the last generated combination after exhausting retries', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    mockedCalculateBreakDuration.mockReturnValue(300);
    const shownCombinations = ['news.example-300'];

    const reward = generateReward(['news.example'], shownCombinations, 70, 0.2);

    expect(reward).toEqual({
      id: 'news.example-300',
      name: 'news.example',
      duration: 300,
    });
    expect(shownCombinations).toHaveLength(2);
    expect(mockedCalculateBreakDuration).toHaveBeenCalledTimes(MAX_REWARD_GENERATION_RETRIES + 1);
  });
});
