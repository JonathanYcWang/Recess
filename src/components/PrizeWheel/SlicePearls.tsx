import { WHEEL_PADDING, WHEEL_SIZE } from '@/constants/constants';
import styles from './PrizeWheel.module.css';

interface SlicePearlsProps {
  displayRotation: number;
  pearls: {
    x: number;
    y: number;
  }[];
}

const SlicePearls = ({ displayRotation, pearls }: SlicePearlsProps) => (
  <svg
    width={WHEEL_SIZE + WHEEL_PADDING}
    height={WHEEL_SIZE + WHEEL_PADDING}
    viewBox={`0 0 ${WHEEL_SIZE + WHEEL_PADDING} ${WHEEL_SIZE + WHEEL_PADDING}`}
    className={styles.slicePearlSvg}
    style={{ transform: `rotate(${displayRotation}deg)` }}
    aria-hidden="true"
  >
    {pearls.map((pearl, index) => (
      <g
        key={index}
        transform={`translate(${pearl.x + WHEEL_PADDING / 2}, ${pearl.y + WHEEL_PADDING / 2})`}
      >
        <circle
          r={5}
          fill={'var(--color-background-primary)'}
          stroke={'var(--color-text-primary)'}
          strokeWidth={2}
        />
        <circle
          r={2}
          fill={index % 2 === 0 ? 'var(--color-gray-700)' : 'var(--color-text-primary)'}
        />
      </g>
    ))}
  </svg>
);

export default SlicePearls;
