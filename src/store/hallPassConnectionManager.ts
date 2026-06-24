import type { HallPassClient, HallPassPublishedSnapshot } from '@/runtime/hallPassTypes';
import type { HallPassRuntimeTransportError } from '@/runtime/messaging/hallPassMessages';
import type { AppDispatch } from './index';
import {
  setHallPassConnectionState,
  setHallPassProjection,
} from './actions/hallPassProjectionActions';
import type { HallPassConnectionState } from './reducers/hallPassProjectionReducer';

const DEFAULT_BACKOFF_MS = [1_000, 2_000, 4_000, 8_000, 16_000] as const;

export const isHallPassTransportError = (error: {
  kind: string;
}): error is HallPassRuntimeTransportError =>
  error.kind === 'missing-receiver' ||
  error.kind === 'closed-channel' ||
  error.kind === 'malformed-payload' ||
  error.kind === 'extension-shutdown' ||
  error.kind === 'transport-unavailable';

const projectSnapshot = (dispatch: AppDispatch, snapshot: HallPassPublishedSnapshot): void => {
  dispatch(
    setHallPassProjection({
      revision: snapshot.revision,
      snapshot: snapshot.snapshot,
      hallPassEntry: snapshot.hallPassEntry,
    })
  );
};

export class HallPassConnectionManager {
  private connectionState: HallPassConnectionState = 'connecting';
  private unsubscribeSnapshot: (() => void) | null = null;
  private retryAttempt = 0;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private recoveryInFlight = false;

  constructor(
    private readonly options: {
      client: HallPassClient;
      dispatch: AppDispatch;
      backoffMs?: readonly number[];
    }
  ) {}

  getConnectionState(): HallPassConnectionState {
    return this.connectionState;
  }

  start(): void {
    void this.recover({ reason: 'initial' });
  }

  markDisconnected(): void {
    const wasConnected = this.connectionState !== 'disconnected';
    this.connectionState = 'disconnected';
    this.options.dispatch(setHallPassConnectionState('disconnected'));
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
      this.options.dispatch(setHallPassConnectionState('connected'));
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
          this.options.dispatch(setHallPassConnectionState('connected'));
        }
      },
      {
        onTransportLoss: () => this.markDisconnected(),
      }
    );
  }
}

let activeManager: HallPassConnectionManager | null = null;

export const startHallPassConnectionManager = (options: {
  client: HallPassClient;
  dispatch: AppDispatch;
  backoffMs?: readonly number[];
}): HallPassConnectionManager => {
  if (activeManager) {
    return activeManager;
  }
  activeManager = new HallPassConnectionManager(options);
  activeManager.start();
  return activeManager;
};

export const getHallPassConnectionManager = (): HallPassConnectionManager | null => activeManager;

export const resetHallPassConnectionManagerForTests = (): void => {
  activeManager?.stop();
  activeManager = null;
};
