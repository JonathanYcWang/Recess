import type { InsightWindow } from '@/modules/insights';

export const INSIGHTS_RUNTIME_CHANNEL = 'recess.insights.runtime.v1';

export type InsightsRuntimeRequest = {
  channel: typeof INSIGHTS_RUNTIME_CHANNEL;
  action: 'query';
  window: InsightWindow;
};

export type InsightsRuntimeMessageResponse =
  | {
      channel: typeof INSIGHTS_RUNTIME_CHANNEL;
      ok: true;
      action: 'query';
      result: unknown;
    }
  | {
      channel: typeof INSIGHTS_RUNTIME_CHANNEL;
      ok: false;
      error: { kind: 'malformed-payload' | 'missing-receiver' | 'query-failed' };
    };

export const isInsightsRuntimeRequest = (message: unknown): message is InsightsRuntimeRequest =>
  typeof message === 'object' &&
  message !== null &&
  (message as InsightsRuntimeRequest).channel === INSIGHTS_RUNTIME_CHANNEL &&
  (message as InsightsRuntimeRequest).action === 'query' &&
  typeof (message as InsightsRuntimeRequest).window === 'string';
