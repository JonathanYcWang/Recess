import { useState, type KeyboardEvent } from 'react';
import { useSelector } from 'react-redux';
import { PrimitiveAlert, PrimitiveButton } from '@/primitives';
import styles from './TaskList.module.css';
import {
  selectIsTaskListDisconnected,
  selectTaskListCompletedTasks,
  selectTaskListIncompleteTasks,
  selectTaskListRevision,
} from '../../store/selectors';
import type { RootState } from '../../store';
import { createAppTaskListClient } from '../../store/taskListClient';
import { TIME_ESTIMATE_OPTIONS_MINUTES } from '@/modules/task-list';

const taskListErrorMessage = (error: { kind: string }): string => {
  switch (error.kind) {
    case 'invalid-title':
      return 'Please enter a task title.';
    case 'invalid-estimate':
      return 'Please choose a valid time estimate.';
    case 'task-not-found':
      return 'That task could not be found.';
    case 'invalid-reorder':
      return 'Could not reorder tasks. Refresh and try again.';
    case 'transport-unavailable':
      return 'Task List is temporarily unavailable. Try again after reconnecting.';
    default:
      return 'Could not update the Task List. Please try again.';
  }
};

const formatEstimateMinutes = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (remainder === 0) {
    return hours === 1 ? '1 hr' : `${hours} hr`;
  }
  return `${hours} hr ${remainder} min`;
};

const formatFocusedTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  return `${minutes} min focused`;
};

const TaskList = () => {
  const incompleteTasks = useSelector((state: RootState) => selectTaskListIncompleteTasks(state));
  const completedTasks = useSelector((state: RootState) => selectTaskListCompletedTasks(state));
  const revision = useSelector((state: RootState) => selectTaskListRevision(state));
  const disconnected = useSelector((state: RootState) => selectIsTaskListDisconnected(state));
  const [title, setTitle] = useState('');
  const [estimateMinutes, setEstimateMinutes] = useState<number>(30);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [error, setError] = useState('');

  const client = () => {
    const taskListClient = createAppTaskListClient();
    if (!taskListClient) {
      setError('Task List is unavailable in this context.');
      return null;
    }
    return taskListClient;
  };

  const handleAdd = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Please enter a task title.');
      return;
    }
    const taskListClient = client();
    if (!taskListClient) {
      return;
    }
    const result = await taskListClient.createTask(
      { title: trimmedTitle, originalEstimateMinutes: estimateMinutes },
      { expectedRevision: revision ?? undefined }
    );
    if (!result.ok) {
      setError(taskListErrorMessage(result.error));
      return;
    }
    setTitle('');
    setError('');
  };

  const handleComplete = async (taskId: string) => {
    const taskListClient = client();
    if (!taskListClient) {
      return;
    }
    const result = await taskListClient.completeTask(taskId, {
      expectedRevision: revision ?? undefined,
    });
    if (!result.ok) {
      setError(taskListErrorMessage(result.error));
    } else {
      setError('');
    }
  };

  const handleDelete = async (taskId: string) => {
    const taskListClient = client();
    if (!taskListClient) {
      return;
    }
    const result = await taskListClient.deleteTask(taskId, {
      expectedRevision: revision ?? undefined,
    });
    if (!result.ok) {
      setError(taskListErrorMessage(result.error));
    } else {
      setError('');
    }
  };

  const startEditing = (taskId: string, currentTitle: string) => {
    setEditingTaskId(taskId);
    setEditingTitle(currentTitle);
    setError('');
  };

  const saveTitle = async (taskId: string) => {
    const taskListClient = client();
    if (!taskListClient) {
      return;
    }
    const result = await taskListClient.updateTitle(taskId, editingTitle, {
      expectedRevision: revision ?? undefined,
    });
    if (!result.ok) {
      setError(taskListErrorMessage(result.error));
      return;
    }
    setEditingTaskId(null);
    setEditingTitle('');
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
      setError(taskListErrorMessage(result.error));
    } else {
      setError('');
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      void handleAdd();
    }
  };

  return (
    <div className={styles.taskList}>
      <div className={styles.headerContainer}>
        <p className={styles.header}>Task List</p>
        <p className={styles.caption}>Plan work with fixed estimates and manual ordering.</p>
      </div>

      <div className={styles.contentContainer}>
        <div className={styles.addForm}>
          <div className={styles.inputRow}>
            <label className={styles.srOnly} htmlFor="task-list-title">
              Task title
            </label>
            <input
              id="task-list-title"
              type="text"
              className={styles.input}
              placeholder="What needs focus?"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                setError('');
              }}
              onKeyDown={handleKeyDown}
              disabled={disconnected}
            />
          </div>
          <div className={styles.inputRow}>
            <label className={styles.srOnly} htmlFor="task-list-estimate">
              Time estimate
            </label>
            <select
              id="task-list-estimate"
              className={styles.select}
              value={estimateMinutes}
              onChange={(event) => setEstimateMinutes(Number(event.target.value))}
              disabled={disconnected}
            >
              {TIME_ESTIMATE_OPTIONS_MINUTES.map((minutes) => (
                <option key={minutes} value={minutes}>
                  {formatEstimateMinutes(minutes)}
                </option>
              ))}
            </select>
            <PrimitiveButton
              className={styles.primaryAction}
              variant="primary"
              onClick={() => void handleAdd()}
              disabled={disconnected}
            >
              Add task
            </PrimitiveButton>
          </div>
        </div>

        {disconnected && (
          <PrimitiveAlert variant="warning" role="status">
            Task List is read-only while disconnected from the background runtime.
          </PrimitiveAlert>
        )}
        {error && <PrimitiveAlert variant="error">{error}</PrimitiveAlert>}

        <div className={styles.tasksList} aria-live="polite">
          {incompleteTasks.map((task, index) => (
            <div key={task.id} className={styles.taskItem}>
              <div className={styles.taskHeader}>
                {editingTaskId === task.id ? (
                  <input
                    className={styles.taskTitleInput}
                    value={editingTitle}
                    aria-label={`Edit title for ${task.title}`}
                    onChange={(event) => setEditingTitle(event.target.value)}
                    onBlur={() => void saveTitle(task.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        void saveTitle(task.id);
                      }
                    }}
                    disabled={disconnected}
                  />
                ) : (
                  <button
                    type="button"
                    className={styles.taskTitleButton}
                    onClick={() => startEditing(task.id, task.title)}
                    disabled={disconnected}
                    aria-label={`Edit title for ${task.title}`}
                  >
                    {task.title}
                  </button>
                )}
              </div>
              <p className={styles.taskMeta}>
                Estimate: {formatEstimateMinutes(task.originalEstimateMinutes)} ·{' '}
                {formatFocusedTime(task.focusedTimeSeconds)}
              </p>
              <div className={styles.taskActions}>
                <button
                  type="button"
                  className={styles.iconButton}
                  aria-label={`Mark ${task.title} complete`}
                  onClick={() => void handleComplete(task.id)}
                  disabled={disconnected}
                >
                  Complete
                </button>
                <button
                  type="button"
                  className={styles.iconButton}
                  aria-label={`Move ${task.title} up`}
                  onClick={() => void moveTask(task.id, 'up')}
                  disabled={disconnected || index === 0}
                >
                  Up
                </button>
                <button
                  type="button"
                  className={styles.iconButton}
                  aria-label={`Move ${task.title} down`}
                  onClick={() => void moveTask(task.id, 'down')}
                  disabled={disconnected || index === incompleteTasks.length - 1}
                >
                  Down
                </button>
                <button
                  type="button"
                  className={styles.iconButton}
                  aria-label={`Delete ${task.title}`}
                  onClick={() => void handleDelete(task.id)}
                  disabled={disconnected}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {completedTasks.length > 0 && (
          <div className={styles.completedSection}>
            <p className={styles.completedHeader}>Completed</p>
            {completedTasks.map((task) => (
              <p key={task.id} className={styles.completedItem}>
                {task.title} · {formatEstimateMinutes(task.originalEstimateMinutes)} ·{' '}
                {formatFocusedTime(task.focusedTimeSeconds)}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskList;
