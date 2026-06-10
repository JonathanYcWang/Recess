import type { ReactNode } from 'react';
import { RING_CENTER, RING_RADIUS, RING_SIZE } from '@/constants/constants';
import styles from './PrizeWheel.module.css';

interface WheelFrameProps {
  children: ReactNode;
}

const WheelFrame = ({ children }: WheelFrameProps) => (
  <svg
    width={RING_SIZE}
    height={RING_SIZE}
    viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
    className={styles.ringSvg}
    aria-hidden="true"
  >
    <circle
      cx={RING_CENTER}
      cy={RING_CENTER}
      r={RING_RADIUS}
      fill="none"
      stroke={'var(--color-text-primary)'}
      strokeWidth={8}
    />
    {children}
  </svg>
);

export default WheelFrame;
