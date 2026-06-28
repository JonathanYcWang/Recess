import type { WorkRhythmClient } from '@/runtime/workRhythmTypes';
import type { AppDispatch } from './index';
import {
  resetWorkRhythmConnectionManagerForTests,
  startWorkRhythmConnectionManager,
} from './workRhythmConnectionManager';

let activeClient: WorkRhythmClient | null = null;

export const startWorkRhythmProjectionSubscription = (options: {
  client: WorkRhythmClient;
  dispatch: AppDispatch;
}): (() => void) => {
  if (activeClient) {
    return () => undefined;
  }

  activeClient = options.client;
  startWorkRhythmConnectionManager({
    client: options.client,
    dispatch: options.dispatch,
  });

  return () => {
    resetWorkRhythmConnectionManagerForTests();
    activeClient = null;
  };
};

export const resetWorkRhythmProjectionSubscriptionForTests = (): void => {
  resetWorkRhythmConnectionManagerForTests();
  activeClient = null;
};
