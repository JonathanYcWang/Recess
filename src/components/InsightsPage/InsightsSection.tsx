import { useState } from 'react';
import InsightsPage from '@/components/InsightsPage/InsightsPage';
import type { InsightWindow } from '@/modules/insights';
import { useInsights } from '@/hooks/useInsights';

const InsightsSection = () => {
  const [window, setWindow] = useState<InsightWindow>('recent-5');
  const { loadState, snapshot, refresh } = useInsights(window);

  return (
    <InsightsPage
      window={window}
      onWindowChange={setWindow}
      loadState={loadState}
      snapshot={snapshot}
      onRefresh={() => {
        void refresh();
      }}
    />
  );
};

export default InsightsSection;
