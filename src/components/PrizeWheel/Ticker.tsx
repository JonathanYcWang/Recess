import {
  RING_CENTER,
  RING_RADIUS,
  TICKER_CAP_WHEEL_RADIUS,
  TICKER_WIDTH,
} from '@/constants/constants';
import styles from './PrizeWheel.module.css';

interface TickerProps {
  tilt: number;
}

const Ticker = ({ tilt }: TickerProps) => (
  <g
    className={styles.ticker}
    style={{
      transform: `rotate(${tilt}deg)`,
      transformOrigin: `${RING_CENTER}px ${RING_CENTER - RING_RADIUS}px`,
    }}
  >
    <g
      transform={`translate(${RING_CENTER - TICKER_WIDTH / 2} ${
        RING_CENTER - RING_RADIUS - TICKER_CAP_WHEEL_RADIUS
      })`}
    >
      <polygon
        points="14,36 2,4 26,4"
        fill={'var(--color-gray-700)'}
        stroke={'var(--color-text-primary)'}
        strokeWidth={2}
      />
      <polygon points="14,30 5,8 14,8" fill="var(--color-background-primary)" opacity={0.55} />
      <circle
        cx={14}
        cy={4}
        r={5}
        fill={'var(--color-gray-700)'}
        stroke={'var(--color-text-primary)'}
        strokeWidth={2}
      />
    </g>
  </g>
);

export default Ticker;
