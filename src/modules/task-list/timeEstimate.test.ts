import { describe, expect, it } from 'vitest';
import {
  TIME_ESTIMATE_OPTIONS_MINUTES,
  deriveRemainingWorkSeconds,
  isValidTimeEstimateMinutes,
} from './timeEstimate';

describe('timeEstimate', () => {
  it('exposes 15-minute steps through 1 hour and 30-minute steps afterward through 8 hours', () => {
    expect(TIME_ESTIMATE_OPTIONS_MINUTES.slice(0, 4)).toEqual([15, 30, 45, 60]);
    expect(TIME_ESTIMATE_OPTIONS_MINUTES).toContain(90);
    expect(TIME_ESTIMATE_OPTIONS_MINUTES).toContain(480);
    expect(TIME_ESTIMATE_OPTIONS_MINUTES).not.toContain(75);
    expect(TIME_ESTIMATE_OPTIONS_MINUTES).not.toContain(510);
  });

  it('validates only supported estimate options', () => {
    expect(isValidTimeEstimateMinutes(15)).toBe(true);
    expect(isValidTimeEstimateMinutes(60)).toBe(true);
    expect(isValidTimeEstimateMinutes(90)).toBe(true);
    expect(isValidTimeEstimateMinutes(20)).toBe(false);
    expect(isValidTimeEstimateMinutes(75)).toBe(false);
  });

  it('derives remaining work seconds from immutable estimate and focused time', () => {
    expect(
      deriveRemainingWorkSeconds({
        originalEstimateMinutes: 30,
        focusedTimeSeconds: 0,
      })
    ).toBe(1800);
    expect(
      deriveRemainingWorkSeconds({
        originalEstimateMinutes: 30,
        focusedTimeSeconds: 600,
      })
    ).toBe(1200);
    expect(
      deriveRemainingWorkSeconds({
        originalEstimateMinutes: 15,
        focusedTimeSeconds: 1000,
      })
    ).toBe(0);
  });
});
