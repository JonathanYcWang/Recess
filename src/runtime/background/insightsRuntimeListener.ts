import type { KeyValueStorageAdapter } from '@/modules/persisted-application-state';
import { queryInsightsSnapshot, type InsightWindow } from '@/modules/insights';
import type { WorkHistoryService } from '@/modules/work-history';
import {
  INSIGHTS_RUNTIME_CHANNEL,
  isInsightsRuntimeRequest,
  type InsightsRuntimeMessageResponse,
} from '../messaging/insightsMessages';
import { getSharedBackgroundCompositionRoot } from './sharedCompositionRoot';

type RuntimeListenerRegistration = {
  workHistory: WorkHistoryService;
};

let registration: RuntimeListenerRegistration | null = null;
let listenerRegistered = false;
let rootReady: Promise<void> = Promise.resolve();

const handleRequest = async (window: InsightWindow): Promise<InsightsRuntimeMessageResponse> => {
  if (!registration) {
    return {
      channel: INSIGHTS_RUNTIME_CHANNEL,
      ok: false,
      error: { kind: 'missing-receiver' },
    };
  }

  const result = await queryInsightsSnapshot(registration.workHistory, window);
  if (!result.ok) {
    return {
      channel: INSIGHTS_RUNTIME_CHANNEL,
      ok: false,
      error: { kind: 'query-failed' },
    };
  }

  return {
    channel: INSIGHTS_RUNTIME_CHANNEL,
    ok: true,
    action: 'query',
    result: result.value,
  };
};

export const registerInsightsRuntimeListener = (options: {
  adapter: KeyValueStorageAdapter;
  runtime: {
    onMessage: {
      addListener(
        listener: (
          message: unknown,
          sender: unknown,
          sendResponse: (response: InsightsRuntimeMessageResponse) => void
        ) => boolean | void
      ): void;
    };
  };
}): void => {
  if (listenerRegistered) {
    return;
  }
  listenerRegistered = true;

  rootReady = getSharedBackgroundCompositionRoot(options.adapter).then((root) => {
    if (!root.ok) {
      return;
    }
    registration = { workHistory: root.value.workHistory };
  });

  options.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!isInsightsRuntimeRequest(message)) {
      return;
    }
    void rootReady.then(() => handleRequest(message.window)).then(sendResponse);
    return true;
  });
};

export const resetInsightsRuntimeListenerForTests = (): void => {
  registration = null;
  listenerRegistered = false;
  rootReady = Promise.resolve();
};
