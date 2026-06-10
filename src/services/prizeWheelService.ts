import {
  ACCEL_FACTOR,
  DECEL_FACTOR,
  MAX_SPEED,
  SEGMENT_COUNT,
  TICKER_MAX_TILT,
} from '@/constants/constants';

export const rotationToSegmentIndex = (rotation: number) => {
  const segmentDegrees = 360 / SEGMENT_COUNT;
  const normalisedRotation = ((-rotation % 360) + 360) % 360;

  return Math.floor(normalisedRotation / segmentDegrees) % SEGMENT_COUNT;
};

export const getNextWheelSpeed = (speed: number, state: 'spinning' | 'stopping') => {
  if (state === 'spinning') {
    return speed + (MAX_SPEED - speed) * ACCEL_FACTOR;
  }

  return speed * DECEL_FACTOR;
};

export const getTickerTilt = (rotation: number) => {
  const segmentDegrees = 360 / SEGMENT_COUNT;
  const rotationInSegment = ((rotation % segmentDegrees) + segmentDegrees) % segmentDegrees;
  const pearlContactZone = segmentDegrees * 0.28;

  if (rotationInSegment >= pearlContactZone) {
    return 0;
  }

  return (1 - rotationInSegment / pearlContactZone) * -TICKER_MAX_TILT;
};
