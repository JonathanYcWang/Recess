import type {
  WorkstyleProfileCommandResponse,
  WorkstyleProfileRuntimeResult,
  WorkstyleProfileSnapshot,
} from '../workstyleProfileTypes';

export const WORKSTYLE_PROFILE_RUNTIME_CHANNEL = 'recess.workstyle-profile.runtime.v1';
export const WORKSTYLE_PROFILE_RUNTIME_PORT_NAME = 'recess.workstyle-profile.runtime.port.v1';

export type WorkstyleProfileRuntimeRequest =
  | { channel: typeof WORKSTYLE_PROFILE_RUNTIME_CHANNEL; action: 'current' }
  | { channel: typeof WORKSTYLE_PROFILE_RUNTIME_CHANNEL; action: 'command'; envelope: unknown };

export type WorkstyleProfileRuntimeMessageResponse =
  | {
      channel: typeof WORKSTYLE_PROFILE_RUNTIME_CHANNEL;
      ok: true;
      action: 'current';
      result: WorkstyleProfileRuntimeResult;
    }
  | {
      channel: typeof WORKSTYLE_PROFILE_RUNTIME_CHANNEL;
      ok: true;
      action: 'command';
      result: WorkstyleProfileCommandResponse;
    }
  | {
      channel: typeof WORKSTYLE_PROFILE_RUNTIME_CHANNEL;
      ok: false;
      error: { kind: 'missing-receiver' | 'malformed-payload' };
    };

export type WorkstyleProfileRuntimePortMessage =
  | { channel: typeof WORKSTYLE_PROFILE_RUNTIME_CHANNEL; action: 'subscribe' }
  | {
      channel: typeof WORKSTYLE_PROFILE_RUNTIME_CHANNEL;
      action: 'snapshot';
      snapshot: WorkstyleProfileSnapshot;
    };

export const isWorkstyleProfileRuntimeRequest = (
  message: unknown
): message is WorkstyleProfileRuntimeRequest =>
  Boolean(
    message &&
    typeof message === 'object' &&
    'channel' in message &&
    (message as WorkstyleProfileRuntimeRequest).channel === WORKSTYLE_PROFILE_RUNTIME_CHANNEL &&
    'action' in message &&
    ((message as WorkstyleProfileRuntimeRequest).action === 'current' ||
      (message as WorkstyleProfileRuntimeRequest).action === 'command')
  );

export const isWorkstyleProfileRuntimePortMessage = (
  message: unknown
): message is WorkstyleProfileRuntimePortMessage =>
  Boolean(
    message &&
    typeof message === 'object' &&
    'channel' in message &&
    (message as WorkstyleProfileRuntimePortMessage).channel === WORKSTYLE_PROFILE_RUNTIME_CHANNEL &&
    'action' in message &&
    ((message as WorkstyleProfileRuntimePortMessage).action === 'subscribe' ||
      (message as WorkstyleProfileRuntimePortMessage).action === 'snapshot')
  );
