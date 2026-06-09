import { afterEach, describe, expect, it, vi } from 'vitest';
import { calculateRemaining, formatTime, formatWorkSessionTime } from './timerService';

describe('timerService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('formatTime', () => {
    it('formats seconds as zero-padded minutes and seconds', () => {
      expect(formatTime(0)).toBe('00:00');
      expect(formatTime(65)).toBe('01:05');
      expect(formatTime(3605)).toBe('60:05');
    });

    it('floors fractional seconds before formatting', () => {
      expect(formatTime(61.9)).toBe('01:01');
    });
  });

  describe('formatWorkSessionTime', () => {
    it('formats minute-only durations', () => {
      expect(formatWorkSessionTime(0)).toBe('0 Min');
      expect(formatWorkSessionTime(59)).toBe('0 Min');
      expect(formatWorkSessionTime(1800)).toBe('30 Min');
    });

    it('formats hour-only and mixed hour durations', () => {
      expect(formatWorkSessionTime(3600)).toBe('1 Hrs');
      expect(formatWorkSessionTime(5400)).toBe('1 Hrs 30 Min');
      expect(formatWorkSessionTime(7200.9)).toBe('2 Hrs');
    });
  });

  describe('calculateRemaining', () => {
    it('returns the initial duration when no entry timestamp is available', () => {
      expect(calculateRemaining(900)).toBe(900);
    });

    it('subtracts elapsed whole seconds from the initial duration', () => {
      vi.spyOn(Date, 'now').mockReturnValue(12_500);

      expect(calculateRemaining(60, 10_000)).toBe(58);
    });

    it('never returns a negative remaining duration', () => {
      vi.spyOn(Date, 'now').mockReturnValue(75_000);

      expect(calculateRemaining(30, 10_000)).toBe(0);
    });
  });
});
