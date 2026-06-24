import type { SettingsCommandResponse, SettingsRuntimeResult, SettingsSnapshot } from '../types';

export const SETTINGS_RUNTIME_CHANNEL = 'recess.settings.runtime.v1';
export const SETTINGS_RUNTIME_PORT_NAME = 'recess.settings.runtime.port.v1';

export type SettingsRuntimeRequest =
  | { channel: typeof SETTINGS_RUNTIME_CHANNEL; action: 'current' }
  | { channel: typeof SETTINGS_RUNTIME_CHANNEL; action: 'command'; envelope: unknown };

export type SettingsRuntimeTransportError =
  | { kind: 'missing-receiver' }
  | { kind: 'closed-channel' }
  | { kind: 'malformed-payload' }
  | { kind: 'extension-shutdown' }
  | { kind: 'transport-unavailable' };

export type SettingsRuntimeMessageResponse =
  | {
      channel: typeof SETTINGS_RUNTIME_CHANNEL;
      ok: true;
      action: 'current';
      result: SettingsRuntimeResult;
    }
  | {
      channel: typeof SETTINGS_RUNTIME_CHANNEL;
      ok: true;
      action: 'command';
      result: SettingsCommandResponse;
    }
  | {
      channel: typeof SETTINGS_RUNTIME_CHANNEL;
      ok: false;
      error: SettingsRuntimeTransportError;
    };

export type SettingsRuntimePortMessage =
  | { channel: typeof SETTINGS_RUNTIME_CHANNEL; action: 'subscribe' }
  | { channel: typeof SETTINGS_RUNTIME_CHANNEL; action: 'snapshot'; snapshot: SettingsSnapshot };

export const isSettingsRuntimeRequest = (message: unknown): message is SettingsRuntimeRequest =>
  Boolean(
    message &&
    typeof message === 'object' &&
    'channel' in message &&
    (message as SettingsRuntimeRequest).channel === SETTINGS_RUNTIME_CHANNEL &&
    'action' in message &&
    ((message as SettingsRuntimeRequest).action === 'current' ||
      (message as SettingsRuntimeRequest).action === 'command')
  );

export const isSettingsRuntimePortMessage = (
  message: unknown
): message is SettingsRuntimePortMessage =>
  Boolean(
    message &&
    typeof message === 'object' &&
    'channel' in message &&
    (message as SettingsRuntimePortMessage).channel === SETTINGS_RUNTIME_CHANNEL &&
    'action' in message &&
    ((message as SettingsRuntimePortMessage).action === 'subscribe' ||
      (message as SettingsRuntimePortMessage).action === 'snapshot')
  );
