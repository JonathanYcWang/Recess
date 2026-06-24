import type {
  HallPassCommandResponse,
  HallPassPublishedSnapshot,
  HallPassRuntimeResult,
} from '../hallPassTypes';

export const HALL_PASS_RUNTIME_CHANNEL = 'recess.hall-pass.runtime.v1';
export const HALL_PASS_RUNTIME_PORT_NAME = 'recess.hall-pass.runtime.port.v1';

export type HallPassRuntimeRequest =
  | { channel: typeof HALL_PASS_RUNTIME_CHANNEL; action: 'current' }
  | { channel: typeof HALL_PASS_RUNTIME_CHANNEL; action: 'command'; envelope: unknown };

export type HallPassRuntimeTransportError =
  | { kind: 'missing-receiver' }
  | { kind: 'closed-channel' }
  | { kind: 'malformed-payload' }
  | { kind: 'extension-shutdown' }
  | { kind: 'transport-unavailable' };

export type HallPassRuntimeMessageResponse =
  | {
      channel: typeof HALL_PASS_RUNTIME_CHANNEL;
      ok: true;
      action: 'current';
      result: HallPassRuntimeResult;
    }
  | {
      channel: typeof HALL_PASS_RUNTIME_CHANNEL;
      ok: true;
      action: 'command';
      result: HallPassCommandResponse;
    }
  | {
      channel: typeof HALL_PASS_RUNTIME_CHANNEL;
      ok: false;
      error: HallPassRuntimeTransportError;
    };

export type HallPassRuntimePortMessage =
  | { channel: typeof HALL_PASS_RUNTIME_CHANNEL; action: 'subscribe' }
  | {
      channel: typeof HALL_PASS_RUNTIME_CHANNEL;
      action: 'snapshot';
      snapshot: HallPassPublishedSnapshot;
    };

export const isHallPassRuntimeRequest = (message: unknown): message is HallPassRuntimeRequest =>
  Boolean(
    message &&
    typeof message === 'object' &&
    'channel' in message &&
    (message as HallPassRuntimeRequest).channel === HALL_PASS_RUNTIME_CHANNEL &&
    'action' in message &&
    ((message as HallPassRuntimeRequest).action === 'current' ||
      (message as HallPassRuntimeRequest).action === 'command')
  );

export const isHallPassRuntimePortMessage = (
  message: unknown
): message is HallPassRuntimePortMessage =>
  Boolean(
    message &&
    typeof message === 'object' &&
    'channel' in message &&
    (message as HallPassRuntimePortMessage).channel === HALL_PASS_RUNTIME_CHANNEL &&
    'action' in message &&
    ((message as HallPassRuntimePortMessage).action === 'subscribe' ||
      (message as HallPassRuntimePortMessage).action === 'snapshot')
  );

export interface HallPassRuntimeMessagePort {
  postMessage(message: HallPassRuntimePortMessage): void;
  disconnect(): void;
  onMessage(listener: (message: HallPassRuntimePortMessage) => void): () => void;
  onDisconnect(listener: () => void): () => void;
}

export interface HallPassRuntimeMessageTransport {
  send(request: HallPassRuntimeRequest): Promise<HallPassRuntimeMessageResponse>;
  connect(): HallPassRuntimeMessagePort;
}
