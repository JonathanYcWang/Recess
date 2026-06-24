export interface ExtensionRuntimePort {
  name?: string;
  postMessage(message: unknown): void;
  disconnect(): void;
  onMessage: {
    addListener(listener: (message: unknown) => void): void;
    removeListener(listener: (message: unknown) => void): void;
  };
  onDisconnect: {
    addListener(listener: () => void): void;
    removeListener(listener: () => void): void;
  };
}

export interface ExtensionRuntimeApi {
  sendMessage(message: unknown): Promise<unknown>;
  connect(options: { name: string }): ExtensionRuntimePort;
  lastError?: { message?: string };
}
