import type {
  SettingsRuntimeMessageResponse,
  SettingsRuntimePortMessage,
  SettingsRuntimeRequest,
  SettingsRuntimeTransportError,
} from './messages';

export interface RuntimeMessagePort<PortMessage = SettingsRuntimePortMessage> {
  postMessage(message: PortMessage): void;
  disconnect(): void;
  onMessage(listener: (message: PortMessage) => void): () => void;
  onDisconnect(listener: () => void): () => void;
}

export interface RuntimeMessageTransport<
  Request = SettingsRuntimeRequest,
  Response = SettingsRuntimeMessageResponse,
  PortMessage = SettingsRuntimePortMessage,
> {
  send(request: Request): Promise<Response>;
  connect(): RuntimeMessagePort<PortMessage>;
}

export type RuntimeMessageTransportResult<T> =
  | { ok: true; value: T }
  | SettingsRuntimeTransportError;
