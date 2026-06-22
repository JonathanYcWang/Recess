import { useMemo } from 'react';
import {
  ICON_RADIUS,
  INNER_RADIUS,
  SEGMENT_ANGLE,
  WHEEL_RADIUS,
  WHEEL_SIZE,
} from './prizeWheelLayout';
import { SEGMENT_COUNT } from '@/constants/constants';
import ParticleBurst from '@/components/ParticleBurst/ParticleBurst';
import type { Segment } from './PrizeWheel.types';
import styles from './PrizeWheel.module.css';
import SlicePearls from './SlicePearls';

interface WheelProps {
  displayRotation: number;
  segments: Segment[];
  winningSegment: Segment | null;
}

const Wheel = ({ displayRotation, segments, winningSegment }: WheelProps) => {
  const isJackpot = winningSegment?.isJackpot ?? false;
  const segmentPaths = useMemo(
    () =>
      segments.map((segment, index) => {
        const startAngle = index * SEGMENT_ANGLE - Math.PI / 2;
        const endAngle = startAngle + SEGMENT_ANGLE;
        const x1 = WHEEL_RADIUS + WHEEL_RADIUS * Math.cos(startAngle);
        const y1 = WHEEL_RADIUS + WHEEL_RADIUS * Math.sin(startAngle);
        const x2 = WHEEL_RADIUS + WHEEL_RADIUS * Math.cos(endAngle);
        const y2 = WHEEL_RADIUS + WHEEL_RADIUS * Math.sin(endAngle);
        const midAngle = startAngle + SEGMENT_ANGLE / 2;
        const iconX = WHEEL_RADIUS + ICON_RADIUS * Math.cos(midAngle);
        const iconY = WHEEL_RADIUS + ICON_RADIUS * Math.sin(midAngle);

        return { segment, x1, y1, x2, y2, iconX, iconY };
      }),
    [segments]
  );

  const slicePearls = useMemo(
    () =>
      Array.from({ length: SEGMENT_COUNT }, (_, index) => {
        const angle = index * SEGMENT_ANGLE - Math.PI / 2;

        return {
          x: WHEEL_RADIUS + WHEEL_RADIUS * Math.cos(angle),
          y: WHEEL_RADIUS + WHEEL_RADIUS * Math.sin(angle),
        };
      }),
    []
  );

  return (
    <>
      <div className={styles.wheelSurface}>
        <svg
          width={WHEEL_SIZE}
          height={WHEEL_SIZE}
          viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}
          className={styles.wheelSvg}
          style={{ transform: `rotate(${displayRotation}deg)` }}
          aria-hidden="true"
        >
          {segmentPaths.map(({ segment, x1, y1, x2, y2, iconX, iconY }, index) => (
            <g key={segment.label}>
              <path
                d={`M ${WHEEL_RADIUS} ${WHEEL_RADIUS} L ${x1} ${y1} A ${WHEEL_RADIUS} ${WHEEL_RADIUS} 0 0 1 ${x2} ${y2} Z`}
                fill={
                  index % 2 == 0 ? 'var(--color-text-primary)' : 'var(--color-background-primary)'
                }
                stroke={'var(--color-text-primary)'}
                strokeWidth={2}
              />
              {segment.isJackpot && (
                <path
                  d={`M ${WHEEL_RADIUS} ${WHEEL_RADIUS} L ${x1} ${y1} A ${WHEEL_RADIUS} ${WHEEL_RADIUS} 0 0 1 ${x2} ${y2} Z`}
                  fill="url(#jackpotGlow)"
                />
              )}
              <foreignObject x={iconX - 19} y={iconY - 19} width={38} height={38}>
                <div className={styles.iconSlot}>{segment.icon}</div>
              </foreignObject>
            </g>
          ))}

          <defs>
            <radialGradient id="hubGrad" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="var(--color-background-primary)" />
              <stop offset="100%" stopColor={'var(--color-gray-700)'} />
            </radialGradient>
          </defs>
          <circle cx={WHEEL_RADIUS} cy={WHEEL_RADIUS} r={INNER_RADIUS} fill="url(#hubGrad)" />
          <circle
            cx={WHEEL_RADIUS}
            cy={WHEEL_RADIUS}
            r={INNER_RADIUS * 0.5}
            fill="var(--color-background-primary)"
            opacity={0.7}
          />
        </svg>

        {winningSegment && (
          <div className={styles.prizeReveal} style={{ transform: `translate(-50%, -50%)` }}>
            <div className={`${styles.prizeCard} ${isJackpot ? styles.jackpotPrize : ''}`}>
              <div className={styles.prizeIcon}>{winningSegment.icon}</div>
              <div>
                <div className={styles.prizeHeading}>{isJackpot ? 'JACKPOT!' : 'You won!'}</div>
                <div className={styles.prizeLabel}>{winningSegment.label}</div>
              </div>
            </div>
          </div>
        )}
        <ParticleBurst display={winningSegment !== null} />
      </div>
      <SlicePearls displayRotation={displayRotation} pearls={slicePearls} />
    </>
  );
};

export default Wheel;
