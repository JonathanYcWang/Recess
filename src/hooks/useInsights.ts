import { useCallback, useEffect, useState } from 'react';
import type { InsightsSnapshot, InsightWindow } from '@/modules/insights';
import { INSIGHTS_RUNTIME_CHANNEL } from '@/runtime/messaging/insightsMessages';

export type InsightsLoadState = 'idle' | 'loading' | 'ready' | 'error';

export const useInsights = (window: InsightWindow) => {
  const [loadState, setLoadState] = useState<InsightsLoadState>('idle');
  const [snapshot, setSnapshot] = useState<InsightsSnapshot | null>(null);

  const refresh = useCallback(async () => {
    setLoadState('loading');
    try {
      const response = await chrome.runtime.sendMessage({
        channel: INSIGHTS_RUNTIME_CHANNEL,
        action: 'query',
        window,
      });
      if (!response?.ok || response.action !== 'query') {
        setLoadState('error');
        setSnapshot(null);
        return;
      }
      setSnapshot(response.result as InsightsSnapshot);
      setLoadState('ready');
    } catch {
      setLoadState('error');
      setSnapshot(null);
    }
  }, [window]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { loadState, snapshot, refresh };
};
