import { describe, expect, it } from 'vitest';
import { completeOnboarding, setHasOnboarded } from '../actions/routingActions';
import routingReducer from './routingReducer';

describe('routingReducer', () => {
  it('starts before onboarding', () => {
    expect(routingReducer(undefined, { type: 'test/init' })).toEqual({
      hasOnboarded: false,
    });
  });

  it('sets and completes onboarding', () => {
    const onboarded = routingReducer(undefined, completeOnboarding());
    const reset = routingReducer(onboarded, setHasOnboarded(false));

    expect(onboarded.hasOnboarded).toBe(true);
    expect(reset.hasOnboarded).toBe(false);
  });
});
