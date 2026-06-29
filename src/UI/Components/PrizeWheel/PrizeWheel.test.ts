import { describe, expect, it } from 'vitest';
import {
  ACCEL_FACTOR,
  DECEL_FACTOR,
  MAX_SPEED,
  TICKER_MAX_TILT,
} from '@/Shared/Constants/Constants';
import {
  getNextWheelSpeed,
  getTickerTilt,
  rotationToSegmentIndex,
} from '@/Shared/Utils/PrizeWheelService';

describe('PrizeWheel utilities', () => {
  describe('rotationToSegmentIndex', () => {
    it('selects the first segment when the wheel is at rest', () => {
      expect(rotationToSegmentIndex(0)).toBe(0);
    });

    it('selects previous segments as the wheel rotates clockwise', () => {
      expect(rotationToSegmentIndex(45)).toBe(7);
      expect(rotationToSegmentIndex(90)).toBe(6);
    });

    it('normalizes rotations outside a single turn', () => {
      expect(rotationToSegmentIndex(360 + 45)).toBe(7);
      expect(rotationToSegmentIndex(-45)).toBe(1);
    });
  });

  describe('getNextWheelSpeed', () => {
    it('eases spinning speed toward max speed', () => {
      expect(getNextWheelSpeed(0, 'spinning')).toBeCloseTo(MAX_SPEED * ACCEL_FACTOR);
    });

    it('decelerates while stopping', () => {
      expect(getNextWheelSpeed(0.2, 'stopping')).toBeCloseTo(0.2 * DECEL_FACTOR);
    });
  });

  describe('getTickerTilt', () => {
    it('tilts fully when a pearl is directly under the ticker', () => {
      expect(getTickerTilt(0)).toBe(-TICKER_MAX_TILT);
    });

    it('returns to neutral outside the pearl contact zone', () => {
      expect(getTickerTilt(20)).toBe(0);
    });

    it('normalizes negative rotations before checking pearl contact', () => {
      expect(getTickerTilt(-45)).toBe(-TICKER_MAX_TILT);
    });
  });
});
