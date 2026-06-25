import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import type { TaskProjection } from '@/modules/task-list';
import { planTasksForFocus, sortTaskIdsByManualOrder } from '@/modules/task-planner';
import {
  selectIsTaskListDisconnected,
  selectTaskListIncompleteTasks,
  selectTaskListRevision,
} from '../../store/selectors';
import type { RootState } from '../../store';
import { createAppTaskListClient } from '../../store/taskListClient';
import Button from '../Button/Button';
import styles from './TaskPlanner.module.css';

interface TaskPlannerProps {
  scheduledFocusSeconds: number;
  onSelectionChange?: (taskIds: string[]) => void;
}

const formatRemainingMinutes = (seconds: number): string => {
  const minutes = Math.max(0, Math.round(seconds / 60));
  return `${minutes} min remaining`;
};

const formatFocusMinutes = (seconds: number): string => {
  const minutes = Math.max(0, Math.round(seconds / 60));
  return `${minutes} min`;
};

const TaskPlanner = ({ scheduledFocusSeconds, onSelectionChange }: TaskPlannerProps) => {
  const incompleteTasks = useSelector((state: RootState) => selectTaskListIncompleteTasks(state));
  const revision = useSelector((state: RootState) => selectTaskListRevision(state));
  const disconnected = useSelector((state: RootState) => selectIsTaskListDisconnected(state));
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [addTaskId, setAddTaskId] = useState('');
  const [error, setError] = useState('');

  const proposal = useMemo(
    () => planTasksForFocus({ incompleteTasks, scheduledFocusSeconds }),
    [incompleteTasks, scheduledFocusSeconds]
  );

  useEffect(() => {
    setSelectedTaskIds(proposal.proposedTaskIds);
  }, [proposal.proposedTaskIds]);

  useEffect(() => {
    onSelectionChange?.(selectedTaskIds);
  }, [onSelectionChange, selectedTaskIds]);

  const selectedTasks = useMemo(
    () =>
      sortTaskIdsByManualOrder(selectedTaskIds, incompleteTasks)
        .map((taskId) => incompleteTasks.find((task) => task.id === taskId))
        .filter((task): task is TaskProjection => task !== undefined),
    [incompleteTasks, selectedTaskIds]
  );

  const totalSelectedRemainingSeconds = selectedTasks.reduce(
    (total, task) => total + task.remainingWorkSeconds,
    0
  );

  const availableToAdd = incompleteTasks.filter((task) => !selectedTaskIds.includes(task.id));

  const client = () => {
    const taskListClient = createAppTaskListClient();
    if (!taskListClient) {
      setError('Task List is unavailable in this context.');
      return null;
    }
    return taskListClient;
  };

  const removeTask = (taskId: string) => {
    setSelectedTaskIds((current) => current.filter((id) => id !== taskId));
    setError('');
  };

  const addTask = () => {
    if (!addTaskId || selectedTaskIds.includes(addTaskId)) {
      return;
    }
    setSelectedTaskIds((current) =>
      sortTaskIdsByManualOrder([...current, addTaskId], incompleteTasks)
    );
    setAddTaskId('');
    setError('');
  };

  const resetToProposal = () => {
    setSelectedTaskIds(proposal.proposedTaskIds);
    setError('');
  };

  const moveTask = async (taskId: string, direction: 'up' | 'down') => {
    const index = incompleteTasks.findIndex((task) => task.id === taskId);
    if (index < 0) {
      return;
    }
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= incompleteTasks.length) {
      return;
    }
    const orderedTaskIds = incompleteTasks.map((task) => task.id);
    const [moved] = orderedTaskIds.splice(index, 1);
    orderedTaskIds.splice(targetIndex, 0, moved);
    const taskListClient = client();
    if (!taskListClient) {
      return;
    }
    const result = await taskListClient.reorderTasks(orderedTaskIds, {
      expectedRevision: revision ?? undefined,
    });
    if (!result.ok) {
      setError('Could not reorder tasks. Refresh and try again.');
      return;
    }
    setError('');
  };

  return (
    <section className={styles.taskPlanner} aria-label="Task planner">
      <h2 className={styles.header}>Suggested tasks</h2>
      <p className={styles.caption}>
        Confirm or edit the tasks for this {formatFocusMinutes(scheduledFocusSeconds)} focus block.
      </p>
      <p className={styles.summary}>
        Selected remaining work: {formatRemainingMinutes(totalSelectedRemainingSeconds)} of{' '}
        {formatFocusMinutes(scheduledFocusSeconds)} scheduled
      </p>

      {selectedTasks.length === 0 ? (
        <p className={styles.emptyMessage}>No tasks selected for this focus block.</p>
      ) : (
        <div className={styles.taskList}>
          {selectedTasks.map((task) => {
            const index = incompleteTasks.findIndex((entry) => entry.id === task.id);
            return (
              <article key={task.id} className={styles.taskItem}>
                <p className={styles.taskTitle}>{task.title}</p>
                <p className={styles.taskMeta}>
                  {formatRemainingMinutes(task.remainingWorkSeconds)}
                </p>
                <div className={styles.taskActions}>
                  <button
                    type="button"
                    className={styles.actionButton}
                    aria-label={`Remove ${task.title} from focus selection`}
                    onClick={() => removeTask(task.id)}
                  >
                    Remove
                  </button>
                  <button
                    type="button"
                    className={styles.actionButton}
                    aria-label={`Move ${task.title} up in task list`}
                    onClick={() => void moveTask(task.id, 'up')}
                    disabled={disconnected || index <= 0}
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    className={styles.actionButton}
                    aria-label={`Move ${task.title} down in task list`}
                    onClick={() => void moveTask(task.id, 'down')}
                    disabled={disconnected || index < 0 || index >= incompleteTasks.length - 1}
                  >
                    Down
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {availableToAdd.length > 0 && (
        <div className={styles.addRow}>
          <label className={styles.srOnly} htmlFor="task-planner-add">
            Add task to focus selection
          </label>
          <select
            id="task-planner-add"
            className={styles.select}
            value={addTaskId}
            onChange={(event) => setAddTaskId(event.target.value)}
            disabled={disconnected}
          >
            <option value="">Add a task…</option>
            {availableToAdd.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </select>
          <Button
            text="Add"
            onClick={addTask}
            variant="secondary"
            disabled={!addTaskId || disconnected}
          />
        </div>
      )}

      <Button text="Use suggestion" onClick={resetToProposal} variant="tertiary" />

      {error && <p className={styles.errorMessage}>{error}</p>}
    </section>
  );
};

export default TaskPlanner;
