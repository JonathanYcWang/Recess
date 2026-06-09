import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  FINAL_STRETCH_THRESHOLD,
  MAX_BREAK_DURATION,
  MAX_FOCUS_SESSION_DURATION,
  MIN_BREAK_DURATION,
  MIN_FOCUS_SESSION_DURATION,
} from '../constants/constants';
import {
  calculateBreakDuration,
  calculateFatigue,
  calculateFocusSessionDuration,
  calculateMomentum,
  momentumToMultiplier,
} from './sessionDurationService';

describe('sessionDurationService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('calculateMomentum', () => {
    it('applies completion EWMA and clamps to the valid score range', () => {
      expect(calculateMomentum(0.2, true)).toBe(0.6);
      expect(calculateMomentum(0.8, false)).toBe(0.4);
      expect(calculateMomentum(1, true, 2)).toBe(1);
      expect(calculateMomentum(0, false, -1)).toBe(0);
    });
  });

  describe('momentumToMultiplier', () => {
    it('formats momentum as a two-decimal multiplier', () => {
      expect(momentumToMultiplier(0)).toBe('0.00x');
      expect(momentumToMultiplier(0.5)).toBe('1.00x');
      expect(momentumToMultiplier(0.875)).toBe('1.75x');
    });
  });

  describe('calculateFatigue', () => {
    it('returns no fatigue before any work has elapsed', () => {
      expect(calculateFatigue(3600, 3600, 900, true)).toBe(0);
    });

    it('combines overall work, progress, incompletion, and session effort factors', () => {
      expect(calculateFatigue(7200, 3600, 1800, false)).toBe(75);
      expect(calculateFatigue(7200, 3600, 1800, true)).toBe(55);
    });

    it('caps session effort against the maximum focus duration', () => {
      expect(calculateFatigue(7200, 0, MAX_FOCUS_SESSION_DURATION * 2, true)).toBe(80);
    });
  });

  describe('calculateFocusSessionDuration', () => {
    it('returns zero when no total time remains', () => {
      expect(calculateFocusSessionDuration(3600, 0, 1, 0)).toBe(0);
    });

    it('uses the exact remaining time during the final stretch', () => {
      const totalTimer = 10_000;
      const finalStretchRemaining = totalTimer * FINAL_STRETCH_THRESHOLD;

      expect(calculateFocusSessionDuration(totalTimer, finalStretchRemaining, 1, 0)).toBe(1500);
      expect(calculateFocusSessionDuration(totalTimer, 1499.9, 1, 0)).toBe(1499);
    });

    it('calculates a five-minute-rounded duration from readiness and caps by remaining time', () => {
      expect(calculateFocusSessionDuration(7200, 7200, 1, 0)).toBe(MAX_FOCUS_SESSION_DURATION);
      expect(calculateFocusSessionDuration(7200, 7200, 0, 100)).toBe(MIN_FOCUS_SESSION_DURATION);
      expect(calculateFocusSessionDuration(7200, 1800, 1, 0)).toBe(1800);
    });
  });

  describe('calculateBreakDuration', () => {
    it('returns the minimum break when readiness is highest', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);

      expect(calculateBreakDuration(0, 1)).toBe(MIN_BREAK_DURATION);
    });

    it('returns a rounded randomized break within the configured bounds', () => {
      vi.spyOn(Math, 'random').mockReturnValue(1);

      expect(calculateBreakDuration(100, 0)).toBe(MAX_BREAK_DURATION);
    });

    it('does not return less than the minimum break after randomization', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);

      expect(calculateBreakDuration(0, 0.8)).toBe(MIN_BREAK_DURATION);
    });
  });
});
