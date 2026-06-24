import type { RootState } from './index';
import { projectAccessContextFromState, publishAccessContext } from './accessContextPublisher';

let active = false;

export const startAccessContextPublisher = (options: {
  getState: () => RootState;
  subscribe: (listener: () => void) => () => void;
}): (() => void) => {
  if (active) {
    return () => undefined;
  }
  active = true;

  let lastSerialized = '';
  const publish = () => {
    const context = projectAccessContextFromState(options.getState());
    const serialized = JSON.stringify(context);
    if (serialized === lastSerialized) {
      return;
    }
    lastSerialized = serialized;
    void publishAccessContext(context);
  };

  publish();
  const unsubscribe = options.subscribe(publish);

  return () => {
    unsubscribe();
    active = false;
  };
};

export const resetAccessContextPublisherForTests = (): void => {
  active = false;
};
