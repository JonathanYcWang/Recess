import styles from './SessionDetailGrid.module.css';

import InfoWidget from '../InfoWidget/InfoWidget';

const SessionDetailGrid = () => {
  return (
    <section className={styles.calculator}>
      <div className={styles.outputsGrid}>
        <InfoWidget
          primaryValue={{ name: 'Freshness Score', value: 100 }}
          items={[
            { name: 'Freshness Score', value: 100 },
            { name: 'Readiness Score', value: 100 },
            { name: 'Momentum Multiplier', value: 1.5 },
            { name: 'Last Session Difficulty', value: 80 },
          ]}
        />
      </div>
    </section>
  );
};

export default SessionDetailGrid;
