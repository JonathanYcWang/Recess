import { createActionBroker } from './actionBroker';
import type {
  BlockListClient,
  BlockListClientError,
  BlockListSnapshot,
} from '@/runtime/blockListTypes';
import type { BlockListRuntimeTransportError } from '@/runtime/messaging/blockListMessages';
import type { AppDispatch } from './index';
import {
  setBlockListConnectionState,
  setBlockListProjection,
} from './actions/blockListProjectionActions';
import type { BlockListConnectionState } from './reducers/blockListProjectionReducer';

const DEFAULT_BACKOFF_MS = [1_000, 2_000, 4_000, 8_000, 16_000] as const;

export const isBlockListTransportError = (
  error: BlockListClientError
): error is BlockListRuntimeTransportError =>
  error.kind === 'missing-receiver' ||
  error.kind === 'closed-channel' ||
  error.kind === 'malformed-payload' ||
  error.kind === 'extension-shutdown' ||
  error.kind === 'transport-unavailable';

const projectSnapshot = (dispatch: AppDispatch, snapshot: BlockListSnapshot): void => {
  createActionBroker(dispatch).route(
    setBlockListProjection({
      revision: snapshot.revision,
      entries: [...snapshot.value.entries],
    })
  );
};

export class BlockListConnectionManager {
  private connectionState: BlockListConnectionState = 'connecting';
  private unsubscribeSnapshot: (() => void) | null = null;
  private retryAttempt = 0;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private recoveryInFlight = false;

  constructor(
    private readonly options: {
      client: BlockListClient;
      dispatch: AppDispatch;
      backoffMs?: readonly number[];
    }
  ) {}

  getConnectionState(): BlockListConnectionState {
    return this.connectionState;
  }

  start(): void {
    void this.recover({ reason: 'initial' });
  }

  markDisconnected(): void {
    const wasConnected = this.connectionState !== 'disconnected';
    this.connectionState = 'disconnected';
    createActionBroker(this.options.dispatch).route(setBlockListConnectionState('disconnected'));
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
      createActionBroker(this.options.dispatch).route(setBlockListConnectionState('connected'));
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
          createActionBroker(this.options.dispatch).route(setBlockListConnectionState('connected'));
        }
      },
      {
        onTransportLoss: () => this.markDisconnected(),
      }
    );
  }
}

let activeManager: BlockListConnectionManager | null = null;

export const startBlockListConnectionManager = (options: {
  client: BlockListClient;
  dispatch: AppDispatch;
  backoffMs?: readonly number[];
}): BlockListConnectionManager => {
  if (activeManager) {
    return activeManager;
  }
  activeManager = new BlockListConnectionManager(options);
  activeManager.start();
  return activeManager;
};

export const getBlockListConnectionManager = (): BlockListConnectionManager | null => activeManager;

export const resetBlockListConnectionManagerForTests = (): void => {
  activeManager?.stop();
  activeManager = null;
};
