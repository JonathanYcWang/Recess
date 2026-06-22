import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  SPIN_ROTATIONS,
  BASE_REEL_SPIN_DURATION_SECONDS,
  REEL_STOP_INTERVAL_SECONDS,
} from '@/constants/constants';
import Slots, { getReelOffset, getReelSpinStyle, replicateReelItems, type SlotReel } from './Slots';

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

describe('getReelSpinStyle', () => {
  it('stops each reel one second after the previous reel', () => {
    expect(getReelSpinStyle(['A', 'B', 'C'], 1, 2, 0)).toEqual({
      '--start-index': 1,
      '--end-index': SPIN_ROTATIONS * 3 + 2,
      '--reel-spin-duration': `${BASE_REEL_SPIN_DURATION_SECONDS}s`,
    });

    expect(getReelSpinStyle(['A', 'B', 'C'], 1, 2, 2)).toMatchObject({
      '--reel-spin-duration': `${BASE_REEL_SPIN_DURATION_SECONDS + 2 * REEL_STOP_INTERVAL_SECONDS}s`,
    });
  });
});
