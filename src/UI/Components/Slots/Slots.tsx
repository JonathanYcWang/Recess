import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import Button from '../Button/Button';
import { SPIN_ROTATIONS } from '@/Shared/Constants/Constants';
import styles from './Slots.module.css';
import { getSlotsAnimationDurationMs, getSlotsReelSpinDurationSeconds } from './slotsTiming';

export interface SlotReel {
  id: string;
  label: string;
  values: string[];
}

interface SpinState {
  isSpinning: boolean;
  selectedIndexes: number[]; // where each reel is resting now
  pendingIndexes: number[]; // where the current spin will land
  spinKey: number; //  remounts reels so CSS animations restart.
  result: string[] | null;
}

interface SlotsProps {
  reels: SlotReel[];
}

const getRandomIndex = (items: string[]) => Math.floor(Math.random() * items.length);

export const replicateReelItems = (items: string[]) => [
  // Add one item before the first value for the top row, then extra repeated values so the final landing row still has content below it.
  items[items.length - 1],
  ...Array.from({ length: SPIN_ROTATIONS + 2 }, () => items).flat(),
];

export const getReelOffset = (
  items: string[],
  currentIndex: number,
  targetIndex: number
): CSSProperties => {
  return {
    '--start-index': currentIndex,
    '--end-index': SPIN_ROTATIONS * items.length + targetIndex,
  } as CSSProperties;
};

export const getReelSpinStyle = (
  items: string[],
  currentIndex: number,
  targetIndex: number,
  reelIndex: number,
  reelCount: number
): CSSProperties => {
  return {
    ...getReelOffset(items, currentIndex, targetIndex),
    '--reel-spin-duration': `${getSlotsReelSpinDurationSeconds(reelIndex, reelCount)}s`,
  } as CSSProperties;
};

const Slots = ({ reels }: SlotsProps) => {
  const spinSettlementTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reelCountStyle = { '--reel-count': reels.length } as CSSProperties;
  const reelItems = useMemo(() => reels.map((reel) => replicateReelItems(reel.values)), [reels]);
  const [spinState, setSpinState] = useState<SpinState>({
    isSpinning: false,
    selectedIndexes: reels.map(() => 0),
    pendingIndexes: reels.map(() => 0),
    spinKey: 0,
    result: null,
  });

  useEffect(() => {
    return () => {
      if (spinSettlementTimeoutRef.current) {
        clearTimeout(spinSettlementTimeoutRef.current);
      }
    };
  }, []);

  const scheduleSpinSettlement = () => {
    if (spinSettlementTimeoutRef.current) {
      clearTimeout(spinSettlementTimeoutRef.current);
    }

    spinSettlementTimeoutRef.current = setTimeout(() => {
      spinSettlementTimeoutRef.current = null;
      handleSpinEnd();
    }, getSlotsAnimationDurationMs(reels.length));
  };

  const handleSpin = () => {
    if (spinState.isSpinning) {
      return;
    }

    setSpinState((currentState) => ({
      ...currentState,
      isSpinning: true,
      pendingIndexes: reels.map((reel) => getRandomIndex(reel.values)),
      spinKey: currentState.spinKey + 1,
      result: null,
    }));

    scheduleSpinSettlement();
  };

  const handleSpinEnd = () => {
    setSpinState((currentState) => ({
      ...currentState,
      isSpinning: false,
      selectedIndexes: currentState.pendingIndexes,
      result: reels.map((reel, reelIndex) => reel.values[currentState.pendingIndexes[reelIndex]]),
    }));
  };

  return (
    <section className={styles.slots} style={reelCountStyle} aria-label="Break reward slot machine">
      <div className={styles.header}>
        {reels.map((reel) => (
          <span className={styles.headerLabel} key={reel.id}>
            {reel.label}
          </span>
        ))}
      </div>

      <div className={styles.reels}>
        <div className={styles.selectionBand} aria-hidden="true" />
        {reels.map((reel, reelIndex) => {
          return (
            <div className={styles.reelWindow} key={reel.id}>
              <div
                key={`${reel.id}-${spinState.spinKey}`}
                className={`${styles.reel} ${spinState.isSpinning ? styles.spinning : ''}`}
                style={getReelSpinStyle(
                  reel.values,
                  spinState.selectedIndexes[reelIndex],
                  spinState.pendingIndexes[reelIndex],
                  reelIndex,
                  reels.length
                )}
              >
                {reelItems[reelIndex].map((value, itemIndex) => (
                  <div className={styles.reelItem} key={`${value}-${itemIndex}`}>
                    {value}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Button
        className={styles.spinButton}
        text={spinState.isSpinning ? 'Spinning' : 'Spin'}
        onClick={handleSpin}
        variant="primary"
        disabled={spinState.isSpinning}
      />

      {spinState.result && (
        <p className={styles.result} aria-live="polite">
          {spinState.result.join(' for ')}
        </p>
      )}
    </section>
  );
};

export default Slots;
