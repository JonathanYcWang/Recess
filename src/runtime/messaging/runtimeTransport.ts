import type {
  SettingsRuntimeMessageResponse,
  SettingsRuntimePortMessage,
  SettingsRuntimeRequest,
  SettingsRuntimeTransportError,
} from './messages';

export interface RuntimeMessagePort {
  postMessage(message: SettingsRuntimePortMessage): void;
  disconnect(): void;
  onMessage(listener: (message: SettingsRuntimePortMessage) => void): () => void;
  onDisconnect(listener: () => void): () => void;
}

export interface RuntimeMessageTransport {
  send(request: SettingsRuntimeRequest): Promise<SettingsRuntimeMessageResponse>;
  connect(): RuntimeMessagePort;
}

export type TransportResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: SettingsRuntimeTransportError };
