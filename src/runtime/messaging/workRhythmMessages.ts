import type {
  WorkRhythmCommandResponse,
  WorkRhythmPublishedSnapshot,
  WorkRhythmRuntimeResult,
} from '../workRhythmTypes';

export const WORK_RHYTHM_RUNTIME_CHANNEL = 'recess.work-rhythm.runtime.v1';
export const WORK_RHYTHM_RUNTIME_PORT_NAME = 'recess.work-rhythm.runtime.port.v1';

export type WorkRhythmRuntimeRequest =
  | { channel: typeof WORK_RHYTHM_RUNTIME_CHANNEL; action: 'current' }
  | { channel: typeof WORK_RHYTHM_RUNTIME_CHANNEL; action: 'command'; envelope: unknown };

export type WorkRhythmRuntimeMessageResponse =
  | {
      channel: typeof WORK_RHYTHM_RUNTIME_CHANNEL;
      ok: true;
      action: 'current';
      result: WorkRhythmRuntimeResult;
    }
  | {
      channel: typeof WORK_RHYTHM_RUNTIME_CHANNEL;
      ok: true;
      action: 'command';
      result: WorkRhythmCommandResponse;
    }
  | {
      channel: typeof WORK_RHYTHM_RUNTIME_CHANNEL;
      ok: false;
      error: WorkRhythmRuntimeTransportError;
    };

export type WorkRhythmRuntimePortMessage =
  | { channel: typeof WORK_RHYTHM_RUNTIME_CHANNEL; action: 'subscribe' }
  | {
      channel: typeof WORK_RHYTHM_RUNTIME_CHANNEL;
      action: 'snapshot';
      snapshot: WorkRhythmPublishedSnapshot;
    };

export type WorkRhythmRuntimeTransportError =
  | { kind: 'missing-receiver' }
  | { kind: 'closed-channel' }
  | { kind: 'malformed-payload' }
  | { kind: 'extension-shutdown' }
  | { kind: 'transport-unavailable' };

export interface WorkRhythmRuntimeMessagePort {
  postMessage(message: WorkRhythmRuntimePortMessage): void;
  disconnect(): void;
  onMessage(listener: (message: WorkRhythmRuntimePortMessage) => void): () => void;
  onDisconnect(listener: () => void): () => void;
}

export interface WorkRhythmRuntimeMessageTransport {
  send(request: WorkRhythmRuntimeRequest): Promise<WorkRhythmRuntimeMessageResponse>;
  connect(): WorkRhythmRuntimeMessagePort;
}

export const isWorkRhythmRuntimeRequest = (message: unknown): message is WorkRhythmRuntimeRequest =>
  Boolean(
    message &&
    typeof message === 'object' &&
    'channel' in message &&
    (message as WorkRhythmRuntimeRequest).channel === WORK_RHYTHM_RUNTIME_CHANNEL &&
    'action' in message &&
    ((message as WorkRhythmRuntimeRequest).action === 'current' ||
      (message as WorkRhythmRuntimeRequest).action === 'command')
  );

export const isWorkRhythmRuntimePortMessage = (
  message: unknown
): message is WorkRhythmRuntimePortMessage =>
  Boolean(
    message &&
    typeof message === 'object' &&
    'channel' in message &&
    (message as WorkRhythmRuntimePortMessage).channel === WORK_RHYTHM_RUNTIME_CHANNEL &&
    'action' in message &&
    ((message as WorkRhythmRuntimePortMessage).action === 'subscribe' ||
      (message as WorkRhythmRuntimePortMessage).action === 'snapshot')
  );
