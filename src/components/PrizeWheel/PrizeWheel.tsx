import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './PrizeWheel.module.css';
import type { Segment } from './PrizeWheel.types';
import Button from '@/components/Button/Button';
import Ticker from './Ticker';
import Wheel from './Wheel';
import WheelFrame from './WheelFrame';
import {
  getNextWheelSpeed,
  getTickerTilt,
  rotationToSegmentIndex,
} from '@/services/prizeWheelService';

const WHEEL_STATE = {
  IDLE: 'idle',
  SPINNING: 'spinning',
  STOPPING: 'stopping',
} as const;

type WheelState = (typeof WHEEL_STATE)[keyof typeof WHEEL_STATE];

const WHEEL_ACTION_LABEL = {
  [WHEEL_STATE.IDLE]: 'Spin',
  [WHEEL_STATE.SPINNING]: 'Stop!',
  [WHEEL_STATE.STOPPING]: 'Stopping...',
} as const;

interface PrizeWheelProps {
  segments: Segment[];
}

const PrizeWheel = ({ segments }: PrizeWheelProps) => {
  const rotationRef = useRef(0);
  const speedRef = useRef(0);
  const animationFrameRef = useRef<number>();
  const wheelStateRef = useRef<WheelState>(WHEEL_STATE.IDLE);
  const revealTimeoutRef = useRef<number>();

  const [displayRotation, setDisplayRotation] = useState(0);
  const [tickerTilt, setTickerTilt] = useState(0);
  const [wheelState, setWheelState] = useState<WheelState>(WHEEL_STATE.IDLE);
  const [winningSegment, setWinningSegment] = useState<number | null>(null);

  const updateWheelState = useCallback((state: WheelState) => {
    wheelStateRef.current = state;
    setWheelState(state);
  }, []);

  const finishSpin = useCallback(() => {
    const segmentIndex = rotationToSegmentIndex(rotationRef.current);

    setDisplayRotation(rotationRef.current);
    setWinningSegment(segmentIndex);
    setTickerTilt(0);

    revealTimeoutRef.current = window.setTimeout(() => {
      updateWheelState(WHEEL_STATE.IDLE);
    }, 400);
  }, [updateWheelState]);

  const animate = useCallback(() => {
    if (wheelStateRef.current === WHEEL_STATE.SPINNING) {
      speedRef.current = getNextWheelSpeed(speedRef.current, WHEEL_STATE.SPINNING);
    }

    if (wheelStateRef.current === WHEEL_STATE.STOPPING) {
      speedRef.current = getNextWheelSpeed(speedRef.current, WHEEL_STATE.STOPPING);
    }

    if (
      wheelStateRef.current !== WHEEL_STATE.SPINNING &&
      wheelStateRef.current !== WHEEL_STATE.STOPPING
    ) {
      return;
    }
    // Treat the wheel as stopped once its speed is visually indistinguishable from zero since the speed will never actually reach 0
    if (wheelStateRef.current === WHEEL_STATE.STOPPING && speedRef.current < 0.05) {
      finishSpin();
      return;
    }

    rotationRef.current += speedRef.current * 16;
    setTickerTilt(getTickerTilt(rotationRef.current));
    setDisplayRotation(rotationRef.current);
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [finishSpin]);

  /*
  When the PrizeWheel component is removed from the page, stop any animation frame and
  cancel any delayed prize reveal logic so React does not try to update state after the component is gone.
  */
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.clearTimeout(revealTimeoutRef.current);
    };
  }, []);

  const handleSpin = useCallback(() => {
    if (wheelStateRef.current !== WHEEL_STATE.IDLE) {
      return;
    }

    window.clearTimeout(revealTimeoutRef.current);
    setWinningSegment(null);
    rotationRef.current = 0;
    speedRef.current = 0;
    setDisplayRotation(0);
    setTickerTilt(0);
    updateWheelState(WHEEL_STATE.SPINNING);
    animationFrameRef.current = requestAnimationFrame(animate); // “Run this function right before the browser repaints the screen.”
  }, [animate, updateWheelState]);

  const handleStop = useCallback(() => {
    if (wheelStateRef.current !== WHEEL_STATE.SPINNING) {
      return;
    }
    updateWheelState(WHEEL_STATE.STOPPING);
  }, [updateWheelState]);

  const handleActionClick = useCallback(() => {
    switch (wheelStateRef.current) {
      case WHEEL_STATE.IDLE:
        return handleSpin();
      case WHEEL_STATE.SPINNING:
        return handleStop();
      default:
        return;
    }
  }, [wheelStateRef, handleSpin, handleStop]);

  const actionDisabled = wheelState === WHEEL_STATE.STOPPING;

  return (
    <div className={styles.card} aria-label="Daily booster wheel">
      <div className={styles.titleBanner}>
        <span className={styles.titleText}>Break Reward Wheel</span>
      </div>

      <div className={styles.wheelFrame}>
        <WheelFrame>
          <Ticker tilt={tickerTilt} />
        </WheelFrame>
        <Wheel
          displayRotation={displayRotation}
          segments={segments}
          winningSegment={winningSegment !== null ? segments[winningSegment] : null}
        />
      </div>

      <Button
        text={WHEEL_ACTION_LABEL[wheelState]}
        onClick={handleActionClick}
        disabled={actionDisabled}
      />

      <p className={styles.infoText}>
        Spin the wheel for free, once every day for a chance to win the Jackpot!
      </p>
    </div>
  );
};

export default PrizeWheel;
