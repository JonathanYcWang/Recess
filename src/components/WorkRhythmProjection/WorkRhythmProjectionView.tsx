import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import {
  selectWorkRhythmConnectionState,
  selectWorkRhythmProjection,
} from '@/store/selectors/workRhythmProjectionSelectors';
import { describeWorkRhythmProjection } from './workRhythmProjectionDisplay';
import styles from './WorkRhythmProjectionView.module.css';

const WorkRhythmProjectionView = () => {
  const { snapshot } = useSelector((state: RootState) => selectWorkRhythmProjection(state));
  const connectionState = useSelector((state: RootState) => selectWorkRhythmConnectionState(state));
  const label = describeWorkRhythmProjection(snapshot, connectionState);

  return (
    <section className={styles.root} aria-live="polite" aria-label={label}>
      <p className={styles.label}>{label}</p>
      {snapshot.phase === 'focus-block' && snapshot.windDownActive ? (
        <p className={styles.windDown}>Wind-down cue active</p>
      ) : null}
    </section>
  );
};

export default WorkRhythmProjectionView;
