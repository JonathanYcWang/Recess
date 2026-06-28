import { useState } from 'react';
import InsightsPage from '@/UI/Components/InsightsPage/InsightsPage';
import type { InsightWindow } from '@/modules/insights';
import { useInsights } from '@/UI/Hooks/useInsights';

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
