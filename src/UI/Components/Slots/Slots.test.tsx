import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  SLOTS_ANIMATION_DURATION_SECONDS,
  SLOTS_DECISION_WINDOW_SECONDS,
  SLOTS_REEL_STOP_INTERVAL_SECONDS,
  SPIN_ROTATIONS,
} from '@/Shared/Constants/Constants';
import Slots, { getReelOffset, getReelSpinStyle, replicateReelItems, type SlotReel } from './Slots';
import {
  getSlotsAnimationDurationMs,
  getSlotsDecisionWindowMs,
  getSlotsReelSpinDurationSeconds,
  getSlotsSettlementDelayMs,
} from './slotsTiming';

const reels: SlotReel[] = [
  {
    id: 'reward',
    label: 'Reward',
    values: ['Notion', 'Reddit', 'Twitch'],
  },
  {
    id: 'time',
    label: 'Time',
    values: ['5 min', '10 min'],
  },
];

describe('Slots', () => {
  it('renders labels, reel values, and the spin button from reel props', () => {
    const markup = renderToStaticMarkup(<Slots reels={reels} />);

    expect(markup).toContain('Reward');
    expect(markup).toContain('Time');
    expect(markup).toContain('Notion');
    expect(markup).toContain('10 min');
    expect(markup).toContain('Spin');
  });

  it('passes the reel count as a CSS custom property', () => {
    const markup = renderToStaticMarkup(<Slots reels={reels} />);

    expect(markup).toContain('--reel-count:2');
  });
});

describe('slots timing constants', () => {
  it('uses a five-second decision window', () => {
    expect(SLOTS_DECISION_WINDOW_SECONDS).toBe(5);
    expect(getSlotsDecisionWindowMs()).toBe(5000);
  });

  it('caps reel animation at three seconds for the final reel', () => {
    expect(SLOTS_ANIMATION_DURATION_SECONDS).toBe(3);
    expect(getSlotsAnimationDurationMs(reels.length)).toBe(3000);
    expect(getSlotsSettlementDelayMs(reels.length)).toBe(3000);
  });

  it('keeps settlement timing independent of reduced-motion presentation', () => {
    expect(getSlotsSettlementDelayMs(reels.length)).toBe(getSlotsAnimationDurationMs(reels.length));
  });
});

describe('replicateReelItems', () => {
  it('adds the final item first so the initial selected row has an item above it', () => {
    expect(replicateReelItems(['A', 'B', 'C'])[0]).toBe('C');
  });

  it('repeats values enough times for the spin path and landing buffer', () => {
    const values = ['A', 'B', 'C'];
    const reelItems = replicateReelItems(values);

    expect(reelItems).toHaveLength(1 + values.length * (SPIN_ROTATIONS + 2));
    expect(reelItems.slice(1, 4)).toEqual(values);
  });
});

describe('getReelOffset', () => {
  it('returns row indexes for CSS to convert into translate offsets', () => {
    expect(getReelOffset(['A', 'B', 'C'], 1, 2)).toEqual({
      '--start-index': 1,
      '--end-index': SPIN_ROTATIONS * 3 + 2,
    });
  });
});

describe('getSlotsReelSpinDurationSeconds', () => {
  it('stops each reel one interval after the previous reel', () => {
    const reelCount = reels.length;

    expect(getSlotsReelSpinDurationSeconds(0, reelCount)).toBe(
      SLOTS_ANIMATION_DURATION_SECONDS - SLOTS_REEL_STOP_INTERVAL_SECONDS
    );
    expect(getSlotsReelSpinDurationSeconds(1, reelCount)).toBe(SLOTS_ANIMATION_DURATION_SECONDS);
  });
});

describe('getReelSpinStyle', () => {
  it('derives reel spin duration from the shared timing helpers', () => {
    const reelCount = reels.length;

    expect(getReelSpinStyle(['A', 'B', 'C'], 1, 2, 0, reelCount)).toEqual({
      '--start-index': 1,
      '--end-index': SPIN_ROTATIONS * 3 + 2,
      '--reel-spin-duration': `${getSlotsReelSpinDurationSeconds(0, reelCount)}s`,
    });

    expect(getReelSpinStyle(['A', 'B', 'C'], 1, 2, 1, reelCount)).toMatchObject({
      '--reel-spin-duration': `${SLOTS_ANIMATION_DURATION_SECONDS}s`,
    });
  });
});
