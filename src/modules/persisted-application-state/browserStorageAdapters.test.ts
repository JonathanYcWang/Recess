import { afterEach, describe, expect, it, vi } from 'vitest';
import { createChromiumKeyValueAdapter } from '@/adapters/browser/chromium/chromiumKeyValueAdapter';
import { createSafariKeyValueAdapter } from '@/adapters/browser/safari/safariKeyValueAdapter';
import { createInMemoryKeyValueAdapter } from '@/adapters/browser/in-memory/inMemoryKeyValueAdapter';
import {
  createPersistedApplicationState,
  describeKeyValueAdapterIntegrationTests,
  describeSettingsDocumentIntegrationTests,
} from '@/modules/persisted-application-state';

describeKeyValueAdapterIntegrationTests(createInMemoryKeyValueAdapter, 'in-memory');

describe('chromium key-value adapter', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const createChromeAdapter = () => {
    const values: Record<string, string> = {};
    const chromeStorage = {
      get: vi.fn((keys: string[], callback: (result: Record<string, unknown>) => void) => {
        const key = keys[0];
        callback({ [key]: values[key] });
      }),
      set: vi.fn((entry: Record<string, string>, callback: () => void) => {
        Object.assign(values, entry);
        callback();
      }),
      remove: vi.fn((keys: string[], callback: () => void) => {
        for (const key of keys) {
          delete values[key];
        }
        callback();
      }),
    };
    vi.stubGlobal('chrome', {
      storage: { local: chromeStorage },
      runtime: { lastError: undefined },
    });
    return createChromiumKeyValueAdapter();
  };

  describeSettingsDocumentIntegrationTests(createChromeAdapter, 'chromium');
  describeKeyValueAdapterIntegrationTests(createChromeAdapter, 'chromium');

  it('returns unavailable when chrome storage is missing', async () => {
    vi.stubGlobal('chrome', undefined);
    const adapter = createChromiumKeyValueAdapter();
    const result = await adapter.get('missing');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('unavailable');
    }
  });

  it('maps quota failures to typed outcomes', async () => {
    const chromeStorage = {
      get: vi.fn((_keys: string[], callback: (result: Record<string, unknown>) => void) => {
        callback({});
      }),
      set: vi.fn((_entry: Record<string, string>, callback: () => void) => {
        Object.assign(globalThis.chrome.runtime, {
          lastError: { message: 'QUOTA_BYTES quota exceeded' },
        });
        callback();
      }),
      remove: vi.fn(),
    };
    vi.stubGlobal('chrome', {
      storage: { local: chromeStorage },
      runtime: { lastError: undefined },
    });
    const adapter = createChromiumKeyValueAdapter();
    const result = await adapter.set('key', 'value');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('quota-exceeded');
    }
  });
});

describe('safari key-value adapter', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const createSafariAdapter = () => {
    const values = new Map<string, string>();
    vi.stubGlobal('browser', {
      storage: {
        local: {
          get: vi.fn(async (keys: string[]) =>
            Object.fromEntries(keys.map((key) => [key, values.get(key)]))
          ),
          set: vi.fn(async (entry: Record<string, string>) => {
            for (const [key, value] of Object.entries(entry)) {
              values.set(key, value);
            }
          }),
          remove: vi.fn(async (keys: string[]) => {
            for (const key of keys) {
              values.delete(key);
            }
          }),
        },
      },
    });
    vi.stubGlobal('chrome', undefined);
    return createSafariKeyValueAdapter();
  };

  describeSettingsDocumentIntegrationTests(createSafariAdapter, 'safari');
  describeKeyValueAdapterIntegrationTests(createSafariAdapter, 'safari');

  it('guards browser globals in non-extension contexts', async () => {
    vi.stubGlobal('browser', undefined);
    vi.stubGlobal('chrome', undefined);
    const adapter = createSafariKeyValueAdapter();
    const result = await adapter.get('missing');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('unavailable');
    }
  });
});

describe('browser adapter parity', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('preserves revision behavior across chromium and in-memory adapters', async () => {
    const memoryState = createPersistedApplicationState({
      adapter: createInMemoryKeyValueAdapter(),
    });
    await memoryState.initialize();
    const memoryCommit = await memoryState.commit([
      {
        document: 'settings',
        expectedRevision: 0,
        value: {
          themePreference: 'system',
          workHours: [],
          blockedSites: ['parity.test'],
          hasOnboarded: true,
          quiz: {
            currentQuestionId: 'Q1',
            selectedChoices: [],
            isComplete: false,
            results: null,
          },
        },
      },
    ]);
    expect(memoryCommit.ok).toBe(true);

    const values: Record<string, string> = {};
    vi.stubGlobal('chrome', {
      storage: {
        local: {
          get: vi.fn((keys: string[], callback: (result: Record<string, unknown>) => void) => {
            callback(Object.fromEntries(keys.map((key) => [key, values[key]])));
          }),
          set: vi.fn((entry: Record<string, string>, callback: () => void) => {
            Object.assign(values, entry);
            callback();
          }),
          remove: vi.fn((keys: string[], callback: () => void) => {
            for (const key of keys) {
              delete values[key];
            }
            callback();
          }),
        },
      },
      runtime: { lastError: undefined },
    });
    const chromiumState = createPersistedApplicationState({
      adapter: createChromiumKeyValueAdapter(),
    });
    await chromiumState.initialize();
    const chromiumCommit = await chromiumState.commit([
      {
        document: 'settings',
        expectedRevision: 0,
        value: {
          themePreference: 'system',
          workHours: [],
          blockedSites: ['parity.test'],
          hasOnboarded: true,
          quiz: {
            currentQuestionId: 'Q1',
            selectedChoices: [],
            isComplete: false,
            results: null,
          },
        },
      },
    ]);
    expect(chromiumCommit.ok).toBe(true);
  });
});
