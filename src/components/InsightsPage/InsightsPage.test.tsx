import { describe, expect, it } from 'vitest';
import { describeInsightResult, formatPercent, INSIGHT_WINDOW_OPTIONS } from './insightsDisplay';

describe('insightsDisplay', () => {
  it('describes insufficient data with required counts', () => {
    expect(
      describeInsightResult({
        state: 'insufficient-data',
        value: null,
        explanation: null,
        requiredCount: 3,
        actualCount: 1,
      })
    ).toContain('Need at least 3');
  });

  it('formats percentages for calculated results', () => {
    expect(formatPercent(88.456)).toBe('88.5%');
  });

  it('exposes recent, recent-30, and all-time window labels', () => {
    expect(INSIGHT_WINDOW_OPTIONS.map((option) => option.id)).toEqual([
      'recent-5',
      'recent-30',
      'all-time',
    ]);
  });
});
