import { createActionBroker } from './actionBroker';
import type { WorkRhythmClient, WorkRhythmPublishedSnapshot } from '@/runtime/workRhythmTypes';
import type { WorkRhythmRuntimeTransportError } from '@/runtime/messaging/workRhythmMessages';
import type { AppDispatch } from './index';
import {
  setWorkRhythmConnectionState,
  setWorkRhythmProjection,
} from './actions/workRhythmProjectionActions';
import type { WorkRhythmConnectionState } from './reducers/workRhythmProjectionReducer';

const DEFAULT_BACKOFF_MS = [1_000, 2_000, 4_000, 8_000, 16_000] as const;

export const isWorkRhythmTransportError = (error: {
  kind: string;
}): error is WorkRhythmRuntimeTransportError =>
  error.kind === 'missing-receiver' ||
  error.kind === 'closed-channel' ||
  error.kind === 'malformed-payload' ||
  error.kind === 'extension-shutdown' ||
  error.kind === 'transport-unavailable';

const projectSnapshot = (dispatch: AppDispatch, snapshot: WorkRhythmPublishedSnapshot): void => {
  createActionBroker(dispatch).route(
    setWorkRhythmProjection({
      revision: snapshot.revision,
      snapshot: snapshot.snapshot,
    })
  );
};

export class WorkRhythmConnectionManager {
  private connectionState: WorkRhythmConnectionState = 'connecting';
  private unsubscribeSnapshot: (() => void) | null = null;
  private retryAttempt = 0;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private recoveryInFlight = false;

  constructor(
    private readonly options: {
      client: WorkRhythmClient;
      dispatch: AppDispatch;
      backoffMs?: readonly number[];
    }
  ) {}

  getConnectionState(): WorkRhythmConnectionState {
    return this.connectionState;
  }

  start(): void {
    void this.recover({ reason: 'initial' });
  }

  markDisconnected(): void {
    const wasConnected = this.connectionState !== 'disconnected';
    this.connectionState = 'disconnected';
    createActionBroker(this.options.dispatch).route(setWorkRhythmConnectionState('disconnected'));
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
      createActionBroker(this.options.dispatch).route(setWorkRhythmConnectionState('connected'));
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
          createActionBroker(this.options.dispatch).route(
            setWorkRhythmConnectionState('connected')
          );
        }
      },
      {
        onTransportLoss: () => this.markDisconnected(),
      }
    );
  }
}

let activeManager: WorkRhythmConnectionManager | null = null;

export const startWorkRhythmConnectionManager = (options: {
  client: WorkRhythmClient;
  dispatch: AppDispatch;
  backoffMs?: readonly number[];
}): WorkRhythmConnectionManager => {
  if (activeManager) {
    return activeManager;
  }
  activeManager = new WorkRhythmConnectionManager(options);
  activeManager.start();
  return activeManager;
};

export const getWorkRhythmConnectionManager = (): WorkRhythmConnectionManager | null =>
  activeManager;

export const resetWorkRhythmConnectionManagerForTests = (): void => {
  activeManager?.stop();
  activeManager = null;
};
