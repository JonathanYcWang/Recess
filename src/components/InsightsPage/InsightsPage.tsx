import type { InsightResult } from '@/modules/insights';
import { PrimitiveButton, PrimitiveSelect } from '@/primitives';
import {
  describeInsightResult,
  formatPercent,
  formatSeconds,
  INSIGHT_WINDOW_OPTIONS,
} from './insightsDisplay';
import styles from './InsightsPage.module.css';

interface InsightCardProps<TValue> {
  title: string;
  description: string;
  result: InsightResult<TValue> | null | undefined;
  renderCalculated: (value: TValue) => React.ReactNode;
  formulaLabel?: string;
}

const InsightCard = <TValue,>({
  title,
  description,
  result,
  renderCalculated,
  formulaLabel,
}: InsightCardProps<TValue>) => {
  const statusText = describeInsightResult(result);
  const explanationId = `${title.replace(/\s+/g, '-').toLowerCase()}-explanation`;

  return (
    <article className={styles.card} aria-labelledby={`${title}-heading`}>
      <header className={styles.cardHeader}>
        <h3 id={`${title}-heading`} className={styles.cardTitle}>
          {title}
        </h3>
        <p className={styles.cardDescription}>{description}</p>
      </header>

      <p className={styles.status} role="status">
        {statusText}
      </p>

      {result?.state === 'calculated' && result.value ? (
        <div className={styles.calculatedValue}>{renderCalculated(result.value)}</div>
      ) : null}

      {result?.explanation ? (
        <details className={styles.explanation}>
          <summary>How this is calculated</summary>
          <div id={explanationId} className={styles.explanationBody}>
            {formulaLabel ? <p>{formulaLabel}</p> : null}
            <p>
              Formula: {result.explanation.formulaId} v{result.explanation.formulaVersion}
            </p>
            <ul>
              {Object.entries(result.explanation.inputs).map(([key, value]) => (
                <li key={key}>
                  {key}: {String(value)}
                </li>
              ))}
            </ul>
            <p>{result.explanation.sourceFactIds.length} underlying facts</p>
          </div>
        </details>
      ) : null}
    </article>
  );
};

interface InsightsPageProps {
  window: (typeof INSIGHT_WINDOW_OPTIONS)[number]['id'];
  onWindowChange: (window: (typeof INSIGHT_WINDOW_OPTIONS)[number]['id']) => void;
  loadState: 'idle' | 'loading' | 'ready' | 'error';
  snapshot: import('@/modules/insights').InsightsSnapshot | null;
  onRefresh: () => void;
}

const InsightsPage = ({
  window,
  onWindowChange,
  loadState,
  snapshot,
  onRefresh,
}: InsightsPageProps) => {
  const windowOptions = INSIGHT_WINDOW_OPTIONS.map((option) => ({
    id: option.id,
    label: option.label,
    value: option.id,
  }));

  return (
    <section className={styles.page} aria-labelledby="insights-heading">
      <header className={styles.header}>
        <h2 id="insights-heading" className={styles.title}>
          Insights
        </h2>
        <p className={styles.lead}>
          Interpretations derived from immutable Work History. Window selection uses resolved Work
          Sessions for focus, recovery, and Time Out families, and non-neutral Reminder occurrences
          for adherence.
        </p>
      </header>

      <div className={styles.controls}>
        <div className={styles.windowControl}>
          <PrimitiveSelect
            id="insights-window"
            label="Window"
            options={windowOptions}
            selectedKey={window}
            onSelectionChange={(key) => {
              if (typeof key !== 'string') {
                return;
              }

              onWindowChange(key as (typeof INSIGHT_WINDOW_OPTIONS)[number]['id']);
            }}
          />
        </div>
        <PrimitiveButton variant="secondary" className={styles.refreshButton} onClick={onRefresh}>
          Refresh
        </PrimitiveButton>
      </div>

      {loadState === 'loading' ? <p role="status">Loading Insights…</p> : null}
      {loadState === 'error' ? (
        <p className={styles.error} role="alert">
          Unable to load Insights right now.
        </p>
      ) : null}

      {snapshot ? (
        <div className={styles.grid}>
          <InsightCard
            title="Estimate accuracy"
            description="Compares completed Task estimates with full-lifetime Focused Time."
            result={snapshot.estimateAccuracy}
            formulaLabel="Accuracy is 100 minus the mean absolute percentage error; variance shows typical over/under estimation."
            renderCalculated={(value) => (
              <>
                <p className={styles.primaryMetric}>
                  {formatPercent(value.accuracyScore)} accurate
                </p>
                <p>Signed variance: {formatPercent(value.signedMeanVariancePercent)}</p>
                <p>{value.taskCount} completed tasks</p>
              </>
            )}
          />
          <InsightCard
            title="Focus and recovery"
            description="Focus and Recess shares among completed Work Sessions in the selected window."
            result={snapshot.focusRecovery}
            renderCalculated={(value) => (
              <>
                <p className={styles.primaryMetric}>
                  {formatPercent(value.focusPercent)} Focus / {formatPercent(value.recessPercent)}{' '}
                  Recess
                </p>
                <p>
                  {formatSeconds(value.focusSeconds)} Focus, {formatSeconds(value.recessSeconds)}{' '}
                  Recess
                </p>
                <p>{value.sessionCount} resolved sessions</p>
              </>
            )}
          />
          <InsightCard
            title="Time Out patterns"
            description="Resolved Time Out intervals across selected Work Sessions."
            result={snapshot.timeOutPatterns}
            renderCalculated={(value) => (
              <>
                <p className={styles.primaryMetric}>{value.count} Time Outs</p>
                <p>
                  Total {formatSeconds(value.totalSeconds)}, average{' '}
                  {formatSeconds(value.averageSeconds)}
                </p>
                <p>
                  {formatPercent(value.sessionsWithTimeOutPercent)} of sessions included a Time Out
                </p>
              </>
            )}
          />
          <InsightCard
            title="Reminder adherence"
            description="Satisfied versus missed non-neutral Reminder occurrences."
            result={snapshot.reminderAdherence}
            renderCalculated={(value) => (
              <>
                <p className={styles.primaryMetric}>
                  {formatPercent(value.adherencePercent)} adherence
                </p>
                <p>
                  {value.satisfiedCount} satisfied, {value.missedCount} missed (
                  {value.occurrenceCount} occurrences)
                </p>
              </>
            )}
          />
        </div>
      ) : null}
    </section>
  );
};

export default InsightsPage;
