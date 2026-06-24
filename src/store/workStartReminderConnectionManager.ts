import type {
  WorkStartReminderClient,
  WorkStartReminderClientError,
  WorkStartReminderPublishedSnapshot,
} from '@/runtime/workStartReminderTypes';
import type { WorkStartReminderRuntimeTransportError } from '@/runtime/messaging/workStartReminderMessages';
import type { AppDispatch } from './index';
import {
  setWorkStartReminderConnectionState,
  setWorkStartReminderProjection,
} from './actions/workStartReminderProjectionActions';
import type { WorkStartReminderConnectionState } from './reducers/workStartReminderProjectionReducer';

const DEFAULT_BACKOFF_MS = [1_000, 2_000, 4_000, 8_000, 16_000] as const;

export const isWorkStartReminderTransportError = (
  error: WorkStartReminderClientError
): error is WorkStartReminderRuntimeTransportError =>
  error.kind === 'missing-receiver' ||
  error.kind === 'closed-channel' ||
  error.kind === 'malformed-payload' ||
  error.kind === 'extension-shutdown' ||
  error.kind === 'transport-unavailable';

const projectSnapshot = (
  dispatch: AppDispatch,
  snapshot: WorkStartReminderPublishedSnapshot
): void => {
  dispatch(
    setWorkStartReminderProjection({
      revision: snapshot.revision,
      schedules: snapshot.snapshot.schedules.map((schedule) => ({
        ...schedule,
        days: [...schedule.days],
      })),
    })
  );
};

export class WorkStartReminderConnectionManager {
  private connectionState: WorkStartReminderConnectionState = 'connecting';
  private unsubscribeSnapshot: (() => void) | null = null;
  private retryAttempt = 0;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private recoveryInFlight = false;

  constructor(
    private readonly options: {
      client: WorkStartReminderClient;
      dispatch: AppDispatch;
      backoffMs?: readonly number[];
    }
  ) {}

  getConnectionState(): WorkStartReminderConnectionState {
    return this.connectionState;
  }

  start(): void {
    void this.recover({ reason: 'initial' });
  }

  markDisconnected(): void {
    const wasConnected = this.connectionState !== 'disconnected';
    this.connectionState = 'disconnected';
    this.options.dispatch(setWorkStartReminderConnectionState('disconnected'));
    this.clearSubscription();
    if (wasConnected || !this.retryTimer) {
      this.scheduleRetry();
    }
  }

  async retryNow(): Promise<void> {
    this.clearRetryTimer();
    await this.recover({ reason: 'manual' });
  }

  stop(): void {
    this.clearRetryTimer();
    this.clearSubscription();
    this.connectionState = 'connecting';
  }

  private clearSubscription(): void {
    this.unsubscribeSnapshot?.();
    this.unsubscribeSnapshot = null;
  }

  private clearRetryTimer(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }

  private scheduleRetry(): void {
    if (this.retryTimer || this.recoveryInFlight) {
      return;
    }
    const backoff = this.options.backoffMs ?? DEFAULT_BACKOFF_MS;
    const delay = backoff[Math.min(this.retryAttempt, backoff.length - 1)];
    this.retryAttempt += 1;
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      void this.recover({ reason: 'backoff' });
    }, delay);
  }

  private async recover(options: { reason: 'initial' | 'manual' | 'backoff' }): Promise<void> {
    if (this.recoveryInFlight) {
      return;
    }
    this.recoveryInFlight = true;
    this.clearRetryTimer();

    try {
      const current = await this.options.client.current();
      if (!current.ok) {
        if (this.connectionState !== 'disconnected') {
          this.markDisconnected();
        } else {
          this.scheduleRetry();
        }
        return;
      }

      projectSnapshot(this.options.dispatch, current.value);
      this.resubscribe();
      this.connectionState = 'connected';
      this.retryAttempt = 0;
      this.options.dispatch(setWorkStartReminderConnectionState('connected'));
    } catch {
      if (options.reason === 'initial') {
        this.markDisconnected();
      } else {
        this.scheduleRetry();
      }
    } finally {
      this.recoveryInFlight = false;
    }
  }

  private resubscribe(): void {
    this.clearSubscription();
    this.unsubscribeSnapshot = this.options.client.subscribe(
      (snapshot) => {
        projectSnapshot(this.options.dispatch, snapshot);
        if (this.connectionState !== 'connected') {
          this.connectionState = 'connected';
          this.retryAttempt = 0;
          this.options.dispatch(setWorkStartReminderConnectionState('connected'));
        }
      },
      {
        onTransportLoss: () => this.markDisconnected(),
      }
    );
  }
}

let activeManager: WorkStartReminderConnectionManager | null = null;

export const startWorkStartReminderConnectionManager = (options: {
  client: WorkStartReminderClient;
  dispatch: AppDispatch;
  backoffMs?: readonly number[];
}): WorkStartReminderConnectionManager => {
  if (activeManager) {
    return activeManager;
  }
  activeManager = new WorkStartReminderConnectionManager(options);
  activeManager.start();
  return activeManager;
};

export const getWorkStartReminderConnectionManager =
  (): WorkStartReminderConnectionManager | null => activeManager;

export const resetWorkStartReminderConnectionManagerForTests = (): void => {
  activeManager?.stop();
  activeManager = null;
};
