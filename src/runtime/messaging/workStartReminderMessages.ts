import type {
  WorkStartReminderCommandResponse,
  WorkStartReminderPublishedSnapshot,
  WorkStartReminderRuntimeResult,
} from '../workStartReminderTypes';

export const WORK_START_REMINDER_RUNTIME_CHANNEL = 'recess.work-start-reminder.runtime.v1';
export const WORK_START_REMINDER_RUNTIME_PORT_NAME = 'recess.work-start-reminder.runtime.port.v1';

export type WorkStartReminderRuntimeRequest =
  | { channel: typeof WORK_START_REMINDER_RUNTIME_CHANNEL; action: 'current' }
  | { channel: typeof WORK_START_REMINDER_RUNTIME_CHANNEL; action: 'command'; envelope: unknown };

export type WorkStartReminderRuntimeTransportError =
  | { kind: 'missing-receiver' }
  | { kind: 'closed-channel' }
  | { kind: 'malformed-payload' }
  | { kind: 'extension-shutdown' }
  | { kind: 'transport-unavailable' };

export type WorkStartReminderRuntimeMessageResponse =
  | {
      channel: typeof WORK_START_REMINDER_RUNTIME_CHANNEL;
      ok: true;
      action: 'current';
      result: WorkStartReminderRuntimeResult;
    }
  | {
      channel: typeof WORK_START_REMINDER_RUNTIME_CHANNEL;
      ok: true;
      action: 'command';
      result: WorkStartReminderCommandResponse;
    }
  | {
      channel: typeof WORK_START_REMINDER_RUNTIME_CHANNEL;
      ok: false;
      error: WorkStartReminderRuntimeTransportError;
    };

export type WorkStartReminderRuntimePortMessage =
  | { channel: typeof WORK_START_REMINDER_RUNTIME_CHANNEL; action: 'subscribe' }
  | {
      channel: typeof WORK_START_REMINDER_RUNTIME_CHANNEL;
      action: 'snapshot';
      snapshot: WorkStartReminderPublishedSnapshot;
    };

export const isWorkStartReminderRuntimeRequest = (
  message: unknown
): message is WorkStartReminderRuntimeRequest =>
  Boolean(
    message &&
    typeof message === 'object' &&
    'channel' in message &&
    (message as WorkStartReminderRuntimeRequest).channel === WORK_START_REMINDER_RUNTIME_CHANNEL &&
    'action' in message &&
    ((message as WorkStartReminderRuntimeRequest).action === 'current' ||
      (message as WorkStartReminderRuntimeRequest).action === 'command')
  );

export const isWorkStartReminderRuntimePortMessage = (
  message: unknown
): message is WorkStartReminderRuntimePortMessage =>
  Boolean(
    message &&
    typeof message === 'object' &&
    'channel' in message &&
    (message as WorkStartReminderRuntimePortMessage).channel ===
      WORK_START_REMINDER_RUNTIME_CHANNEL &&
    'action' in message &&
    ((message as WorkStartReminderRuntimePortMessage).action === 'subscribe' ||
      (message as WorkStartReminderRuntimePortMessage).action === 'snapshot')
  );

export interface WorkStartReminderRuntimeMessagePort {
  postMessage(message: WorkStartReminderRuntimePortMessage): void;
  disconnect(): void;
  onMessage(listener: (message: WorkStartReminderRuntimePortMessage) => void): () => void;
  onDisconnect(listener: () => void): () => void;
}

export interface WorkStartReminderRuntimeMessageTransport {
  send(request: WorkStartReminderRuntimeRequest): Promise<WorkStartReminderRuntimeMessageResponse>;
  connect(): WorkStartReminderRuntimeMessagePort;
}
