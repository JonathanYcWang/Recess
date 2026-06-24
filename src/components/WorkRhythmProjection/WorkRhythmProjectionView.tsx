import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import {
  selectWorkRhythmConnectionState,
  selectWorkRhythmProjection,
} from '@/store/selectors/workRhythmProjectionSelectors';
import { selectHallPassProjection } from '@/store/selectors/hallPassProjectionSelectors';
import { createAppHallPassClient } from '@/store/hallPassClient';
import { describeWorkRhythmProjection } from './workRhythmProjectionDisplay';
import styles from './WorkRhythmProjectionView.module.css';

const WorkRhythmProjectionView = () => {
  const { snapshot } = useSelector((state: RootState) => selectWorkRhythmProjection(state));
  const connectionState = useSelector((state: RootState) => selectWorkRhythmConnectionState(state));
  const hallPassProjection = useSelector((state: RootState) => selectHallPassProjection(state));
  const label = describeWorkRhythmProjection(snapshot, connectionState);
  const hallPassClient = createAppHallPassClient();
  const pending = hallPassProjection.snapshot.pendingRequest;
  const activePass = hallPassProjection.snapshot.activePass;

  const confirmHallPass = () => {
    if (!pending || !hallPassClient) {
      return;
    }
    void hallPassClient.confirmGrant(pending.requestId, {
      expectedRevision: hallPassProjection.revision ?? undefined,
    });
  };

  const cancelHallPass = () => {
    if (!pending || !hallPassClient) {
      return;
    }
    void hallPassClient.cancelPending(pending.requestId, {
      expectedRevision: hallPassProjection.revision ?? undefined,
    });
  };

  const revokeHallPass = () => {
    if (!activePass || !hallPassClient) {
      return;
    }
    void hallPassClient.revoke(activePass.passId, {
      expectedRevision: hallPassProjection.revision ?? undefined,
    });
  };

  return (
    <section className={styles.root} aria-live="polite" aria-label={label}>
      <p className={styles.label}>{label}</p>
      {snapshot.phase === 'focus-block' && snapshot.windDownActive ? (
        <p className={styles.windDown}>Wind-down cue active</p>
      ) : null}
      {snapshot.phase === 'time-out' && pending ? (
        <div className={styles.hallPassPrompt} aria-label="Hall Pass confirmation">
          <p className={styles.hallPassTitle}>Hall Pass for {pending.destination}</p>
          <p className={styles.hallPassRate}>
            {hallPassProjection.snapshot.rateCoinsPerMinute} Coin per completed active minute
          </p>
          <p className={styles.hallPassBalance}>
            Balance: {hallPassProjection.snapshot.coinBalance} Coins
          </p>
          <div className={styles.hallPassActions}>
            <button
              type="button"
              className={styles.confirmButton}
              disabled={hallPassProjection.snapshot.coinBalance < 1}
              onClick={confirmHallPass}
            >
              Confirm
            </button>
            <button type="button" className={styles.cancelButton} onClick={cancelHallPass}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}
      {snapshot.phase === 'time-out' && activePass ? (
        <div className={styles.hallPassActive} aria-label="Active Hall Pass">
          <p className={styles.hallPassTitle}>Hall Pass active: {activePass.destination}</p>
          <p className={styles.hallPassBalance}>Billed minutes: {activePass.billedMinuteCount}</p>
          <button type="button" className={styles.cancelButton} onClick={revokeHallPass}>
            Revoke
          </button>
        </div>
      ) : null}
    </section>
  );
};

export default WorkRhythmProjectionView;
