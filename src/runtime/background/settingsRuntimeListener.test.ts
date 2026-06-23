import { describe, expect, it, vi } from 'vitest';
import { createInMemoryKeyValueAdapter } from '@/adapters/browser/in-memory/inMemoryKeyValueAdapter';
import {
  registerSettingsRuntimeListener,
  resetSettingsRuntimeListenerForTests,
} from './settingsRuntimeListener';
import { SETTINGS_RUNTIME_CHANNEL } from '../messaging/messages';
import * as compositionRootModule from './backgroundCompositionRoot';

describe('settings runtime listener', () => {
  it('returns missing-receiver when composition root initialization fails', async () => {
    resetSettingsRuntimeListenerForTests();
    vi.spyOn(compositionRootModule, 'createBackgroundCompositionRoot').mockResolvedValue({
      ok: false,
      error: { kind: 'persistence-unavailable' },
    });

    let onMessage:
      | ((
          message: unknown,
          sender: unknown,
          sendResponse: (response: unknown) => void
        ) => boolean | void)
      | null = null;

    registerSettingsRuntimeListener({
      adapter: createInMemoryKeyValueAdapter(),
      runtime: {
        onMessage: {
          addListener(listener) {
            onMessage = listener;
          },
        },
        onConnect: {
          addListener() {},
        },
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    const response = await new Promise<unknown>((resolve) => {
      onMessage?.({ channel: SETTINGS_RUNTIME_CHANNEL, action: 'current' }, {}, resolve);
    });

    expect(response).toEqual({
      channel: SETTINGS_RUNTIME_CHANNEL,
      ok: false,
      error: { kind: 'missing-receiver' },
    });

    vi.restoreAllMocks();
    resetSettingsRuntimeListenerForTests();
  });
});
