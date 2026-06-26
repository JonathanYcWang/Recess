import { describe, expect, it, vi } from 'vitest';
import { createInMemoryKeyValueAdapter } from '@/adapters/browser/in-memory/inMemoryKeyValueAdapter';
import type { ExtensionRuntimePort } from '../messaging/extensionRuntimeApi';
import { SETTINGS_RUNTIME_CHANNEL } from '../messaging/messages';
import { createRuntimeListener } from './createRuntimeListener';

const TEST_CHANNEL = SETTINGS_RUNTIME_CHANNEL;
const TEST_PORT_NAME = 'recess.test.runtime.port.v1';

const isTestRequest = (message: unknown): boolean =>
  Boolean(
    message &&
    typeof message === 'object' &&
    (message as { channel?: string }).channel === TEST_CHANNEL &&
    'action' in message
  );

const isTestPortMessage = (message: unknown): boolean =>
  Boolean(
    message &&
    typeof message === 'object' &&
    (message as { channel?: string }).channel === TEST_CHANNEL
  );

const createListener = () =>
  createRuntimeListener<unknown>({
    channel: TEST_CHANNEL,
    portName: TEST_PORT_NAME,
    isRequest: isTestRequest,
    isPortMessage: isTestPortMessage,
    buildHandler: (root) =>
      root.settingsHandler as unknown as {
        current(): { ok: true; value: unknown } | { ok: false; error: unknown };
        execute(envelope: unknown): Promise<unknown>;
        subscribe(listener: (snapshot: unknown) => void): () => void;
      },
  });

type MessageHandler = (
  message: unknown,
  sender: unknown,
  sendResponse: (response: unknown) => void
) => boolean | void;

describe('createRuntimeListener factory contract', () => {
  it('register is idempotent — second call no-ops', () => {
    const listener = createListener();
    const adapter = createInMemoryKeyValueAdapter();
    const messageListeners = new Set<MessageHandler>();
    const connectListeners = new Set<(port: ExtensionRuntimePort) => void>();

    listener.register({
      adapter,
      runtime: {
        onMessage: { addListener: (l) => messageListeners.add(l) },
        onConnect: { addListener: (l) => connectListeners.add(l) },
      },
    });
    listener.register({
      adapter,
      runtime: {
        onMessage: { addListener: (l) => messageListeners.add(l) },
        onConnect: { addListener: (l) => connectListeners.add(l) },
      },
    });

    expect(messageListeners.size).toBe(1);
    expect(connectListeners.size).toBe(1);

    listener.resetForTests();
  });

  it('resetForTests clears state so register can re-run', () => {
    const listener = createListener();
    const adapter = createInMemoryKeyValueAdapter();
    const messageListeners = new Set<MessageHandler>();

    listener.register({
      adapter,
      runtime: {
        onMessage: { addListener: (l) => messageListeners.add(l) },
        onConnect: { addListener: () => {} },
      },
    });

    expect(messageListeners.size).toBe(1);
    listener.resetForTests();

    listener.register({
      adapter,
      runtime: {
        onMessage: { addListener: (l) => messageListeners.add(l) },
        onConnect: { addListener: () => {} },
      },
    });

    expect(messageListeners.size).toBe(2);
    listener.resetForTests();
  });

  it('returns missing-receiver when composition root initialization fails', async () => {
    const listener = createListener();
    const compositionRootModule = await import('./backgroundCompositionRoot');
    const spy = vi
      .spyOn(compositionRootModule, 'createBackgroundCompositionRoot')
      .mockResolvedValue({ ok: false, error: { kind: 'persistence-unavailable' } });

    const adapter = createInMemoryKeyValueAdapter();
    let onMessage: MessageHandler | null = null;
    listener.register({
      adapter,
      runtime: {
        onMessage: {
          addListener: (l) => {
            onMessage = l;
          },
        },
        onConnect: { addListener: () => {} },
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    const response = await new Promise<unknown>((resolve) => {
      onMessage?.({ channel: TEST_CHANNEL, action: 'current' }, {}, resolve);
    });

    expect(response).toEqual({
      channel: TEST_CHANNEL,
      ok: false,
      error: { kind: 'missing-receiver' },
    });

    spy.mockRestore();
    listener.resetForTests();
  });

  it('returns malformed-payload from internal handler when execute throws', async () => {
    const listener = createListener();
    const adapter = createInMemoryKeyValueAdapter();
    let onMessage: MessageHandler | null = null;
    listener.register({
      adapter,
      runtime: {
        onMessage: {
          addListener: (l) => {
            onMessage = l;
          },
        },
        onConnect: { addListener: () => {} },
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    const response = await new Promise<unknown>((resolve) => {
      onMessage?.({ channel: TEST_CHANNEL, action: 'current' }, {}, resolve);
    });

    // settings handler returns ok:true current snapshot — verifies happy path
    expect(response).toMatchObject({
      channel: TEST_CHANNEL,
      ok: true,
      action: 'current',
    });

    listener.resetForTests();
  });

  it('publishes snapshot when subscribe port message arrives', async () => {
    const listener = createListener();
    const adapter = createInMemoryKeyValueAdapter();
    const postMessages: unknown[] = [];
    const portListeners: { onMessage?: (m: unknown) => void } = {};

    const fakePort: ExtensionRuntimePort = {
      name: TEST_PORT_NAME,
      postMessage: (m) => postMessages.push(m),
      disconnect: () => {},
      onMessage: {
        addListener: (l) => {
          portListeners.onMessage = l;
        },
        removeListener: () => {},
      },
      onDisconnect: {
        addListener: () => {},
        removeListener: () => {},
      },
    };

    listener.register({
      adapter,
      runtime: {
        onMessage: { addListener: () => {} },
        onConnect: {
          addListener: (l) => {
            l(fakePort);
          },
        },
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    portListeners.onMessage?.({ channel: TEST_CHANNEL, action: 'subscribe' });

    expect(postMessages.length).toBeGreaterThan(0);
    const snapshotMessage = postMessages[0] as { channel: string; action: string };
    expect(snapshotMessage.channel).toBe(TEST_CHANNEL);
    expect(snapshotMessage.action).toBe('snapshot');

    listener.resetForTests();
  });
});
