import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import { selectIsTaskListDisconnected, selectTaskListIncompleteTasks } from '@/store/selectors';
import {
  selectWorkRhythmConnectionState,
  selectWorkRhythmPhase,
  selectWorkRhythmProjection,
} from '@/store/selectors/workRhythmProjectionSelectors';
import { createAppWorkRhythmClient } from '@/store/workRhythmClient';
import styles from './FocusTaskSelection.module.css';

const FocusTaskSelection = () => {
  const phase = useSelector((state: RootState) => selectWorkRhythmPhase(state));
  const { revision } = useSelector((state: RootState) => selectWorkRhythmProjection(state));
  const workRhythmDisconnected = useSelector((state: RootState) =>
    selectWorkRhythmConnectionState(state) === 'disconnected' ? true : false
  );
  const taskListDisconnected = useSelector((state: RootState) =>
    selectIsTaskListDisconnected(state)
  );
  const incompleteTasks = useSelector((state: RootState) => selectTaskListIncompleteTasks(state));
  const snapshot = useSelector((state: RootState) => selectWorkRhythmProjection(state)).snapshot;

  if (phase !== 'focus-block' || snapshot.phase !== 'focus-block') {
    return null;
  }

  const disconnected = workRhythmDisconnected || taskListDisconnected;
  const selectedTaskIds = snapshot.selectedTaskIds;
  const activeTaskId = snapshot.activeTaskId;
  const client = createAppWorkRhythmClient();

  const toggleSelected = (taskId: string) => {
    if (!client || disconnected) {
      return;
    }
    const nextSelection = selectedTaskIds.includes(taskId)
      ? selectedTaskIds.filter((id) => id !== taskId)
      : [...selectedTaskIds, taskId];
    void client.selectTasks(nextSelection, { expectedRevision: revision ?? undefined });
  };

  const activateTask = (taskId: string) => {
    if (!client || disconnected) {
      return;
    }
    void client.setActiveTask(taskId, { expectedRevision: revision ?? undefined });
  };

  return (
    <section className={styles.root} aria-label="Focus task selection">
      <p className={styles.header}>Focus tasks</p>
      <p className={styles.caption}>Optional: select tasks and mark one active for focused time.</p>
      <ul className={styles.taskList}>
        {incompleteTasks.map((task) => {
          const selected = selectedTaskIds.includes(task.id);
          const active = activeTaskId === task.id;
          return (
            <li key={task.id} className={styles.taskItem}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={selected}
                  disabled={disconnected}
                  onChange={() => toggleSelected(task.id)}
                />
                <span>{task.title}</span>
              </label>
              {selected ? (
                <button
                  type="button"
                  className={active ? styles.activeButton : styles.activateButton}
                  disabled={disconnected || active}
                  onClick={() => activateTask(task.id)}
                >
                  {active ? 'Active' : 'Activate'}
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default FocusTaskSelection;
