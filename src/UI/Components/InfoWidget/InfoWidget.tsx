import styles from './InfoWidget.module.css';

interface InfoWidgetProps {
  primaryValue: { name: string; value: number };
  items: { name: string; value: number }[];
}

const InfoWidget = ({ primaryValue, items }: InfoWidgetProps) => {
  // const { label } = getFatigueState(score);
  const label = 'fresh';
  const statusClassName = styles[`status${label}`];
  const progressClassName = styles[`progress${label}`];

  return (
    <section className={styles.widget} aria-label="Fatigue score">
      <div className={styles.headerRow}>
        <h2 className={styles.title}>{primaryValue.name}</h2>
        <span className={`${styles.statusPill} ${statusClassName}`}>{label}</span>
      </div>

      <div className={styles.secondaryRow}>
        <div className={styles.scoreGroup}>
          <p className={styles.scoreValue}>{primaryValue.value}</p>
        </div>
      </div>

      <progress
        className={`${styles.progress} ${progressClassName}`}
        value={primaryValue.value}
        max={100}
        aria-label="Fatigue score meter"
      />

      <div className={styles.progressBreakdown}>
        {items.map((item) => (
          <div key={item.name} className={styles.breakdownItem}>
            <p className={styles.breakdownLabel}>{item.name}</p>
            <p className={styles.breakdownValue}>{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default InfoWidget;
