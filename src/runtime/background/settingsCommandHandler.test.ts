import { describe, expect, it, vi } from 'vitest';
import { createInMemoryKeyValueAdapter } from '@/adapters/browser/in-memory/inMemoryKeyValueAdapter';
import { createDiagnosticRingBuffer } from '@/modules/persisted-application-state/diagnostics/diagnosticRingBuffer';
import { createPersistedApplicationState } from '@/modules/persisted-application-state/persistedApplicationState';
import { settingsCodec } from '@/modules/persisted-application-state/settings/settingsCodec';
import { COMMAND_LEDGER_LIMIT } from '@/runtime/commandLedger';
import { RUNTIME_PROTOCOL_VERSION } from '@/runtime/protocol/types';
import { createSettingsCommandHandler } from '@/runtime/background/settingsCommandHandler';

const createHandler = async () => {
  const adapter = createInMemoryKeyValueAdapter();
  const diagnostics = createDiagnosticRingBuffer();
  const persistence = createPersistedApplicationState({ adapter, diagnostics });
  const initialized = await persistence.initialize();
  if (!initialized.ok) {
    throw new Error('expected initialization to succeed');
  }
  const handler = createSettingsCommandHandler(persistence, initialized.value.documents.settings, {
    diagnostics,
  });
  return { handler, persistence, diagnostics };
};

const createEnvelope = (
  overrides: Partial<{
    commandId: string;
    expectedRevision: number;
    preference: unknown;
    protocolVersion: number;
  }> = {}
) => ({
  protocolVersion: overrides.protocolVersion ?? RUNTIME_PROTOCOL_VERSION,
  commandId: overrides.commandId ?? `cmd-${Math.random()}`,
  module: 'settings' as const,
  expectedRevision: overrides.expectedRevision,
  command: {
    kind: 'set-theme-preference' as const,
    preference: overrides.preference ?? 'dark',
  },
});

describe('settings command handler', () => {
  it('rejects unsupported protocol versions', async () => {
    const { handler } = await createHandler();
    const response = await handler.execute(createEnvelope({ protocolVersion: 99 }));
    expect(response).toEqual({
      ok: false,
      error: { kind: 'unsupported-protocol', supportedVersion: RUNTIME_PROTOCOL_VERSION },
    });
  });

  it('rejects malformed commands', async () => {
    const { handler } = await createHandler();
    const response = await handler.execute({ protocolVersion: 1 } as never);
    expect(response.ok).toBe(false);
    if (!response.ok) {
      expect(response.error.kind).toBe('malformed-command');
    }
  });

  it('rejects invalid theme preferences without committing', async () => {
    const { handler } = await createHandler();
    const response = await handler.execute(createEnvelope({ preference: 'sepia' }));
    expect(response).toEqual({ ok: false, error: { kind: 'invalid-theme-preference' } });

    const current = handler.current();
    expect(current).toMatchObject({
      ok: true,
      value: { revision: 0, value: { themePreference: 'system' } },
    });
  });

  it('fails stale revisions without committing', async () => {
    const { handler } = await createHandler();
    const response = await handler.execute(createEnvelope({ expectedRevision: 5 }));
    expect(response).toEqual({
      ok: false,
      error: { kind: 'stale-revision', expectedRevision: 5, actualRevision: 0 },
    });
  });

  it('handles concurrent revisions safely', async () => {
    const { handler } = await createHandler();
    const first = handler.execute(
      createEnvelope({ commandId: 'cmd-a', expectedRevision: 0, preference: 'dark' })
    );
    const second = handler.execute(
      createEnvelope({ commandId: 'cmd-b', expectedRevision: 0, preference: 'light' })
    );
    const [firstResult, secondResult] = await Promise.all([first, second]);

    const successes = [firstResult, secondResult].filter((result) => result.ok);
    const failures = [firstResult, secondResult].filter((result) => !result.ok);
    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);
    if (!failures[0].ok) {
      expect(failures[0].error.kind).toBe('stale-revision');
    }
  });

  it('returns the original success response for repeated commandIds', async () => {
    const { handler } = await createHandler();
    const envelope = createEnvelope({ commandId: 'cmd-repeat-success', preference: 'dark' });
    const first = await handler.execute(envelope);
    const second = await handler.execute(envelope);
    expect(first).toEqual(second);
    expect(first).toMatchObject({
      ok: true,
      revision: 1,
      snapshot: { value: { themePreference: 'dark' } },
    });

    const current = handler.current();
    expect(current).toMatchObject({
      ok: true,
      value: { revision: 1, value: { themePreference: 'dark' } },
    });
  });

  it('returns the original failure response for repeated commandIds', async () => {
    const { handler } = await createHandler();
    const envelope = createEnvelope({
      commandId: 'cmd-repeat-failure',
      preference: 'sepia',
    });
    const first = await handler.execute(envelope);
    const second = await handler.execute(envelope);
    expect(first).toEqual(second);
    expect(first).toEqual({ ok: false, error: { kind: 'invalid-theme-preference' } });
  });

  it('records unexpected exceptions as sanitized diagnostics', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const diagnostics = createDiagnosticRingBuffer();
    const persistence = createPersistedApplicationState({ adapter, diagnostics });
    const initialized = await persistence.initialize();
    if (!initialized.ok) {
      throw new Error('expected initialization to succeed');
    }
    const handler = createSettingsCommandHandler(
      persistence,
      initialized.value.documents.settings,
      { diagnostics }
    );
    vi.spyOn(persistence, 'commit').mockRejectedValueOnce(new Error('boom'));

    const response = await handler.execute(createEnvelope({ commandId: 'cmd-boom' }));
    expect(response.ok).toBe(false);
    if (!response.ok && response.error.kind === 'unexpected-runtime') {
      expect(response.error.diagnosticId).toMatch(/^diag-/);
    }
    expect(diagnostics.all()).toEqual([
      expect.objectContaining({
        category: 'unexpected-runtime',
        message: 'boom',
        context: { commandId: 'cmd-boom', module: 'settings' },
      }),
    ]);
  });

  it('evicts completed outcomes after 256 commands', async () => {
    const { handler } = await createHandler();
    const original = await handler.execute(
      createEnvelope({ commandId: 'cmd-0', preference: 'dark' })
    );
    expect(original.ok).toBe(true);
    if (!original.ok) {
      return;
    }
    const originalRevision = original.revision;

    for (let index = 1; index < COMMAND_LEDGER_LIMIT + 1; index += 1) {
      await handler.execute(
        createEnvelope({
          commandId: `cmd-${index}`,
          preference: index % 2 === 0 ? 'dark' : 'light',
        })
      );
    }

    const replayed = await handler.execute(
      createEnvelope({ commandId: 'cmd-0', preference: 'dark' })
    );
    expect(replayed.ok).toBe(true);
    if (replayed.ok) {
      expect(replayed.revision).toBeGreaterThan(originalRevision);
    }
  });
});

describe('settings command decode', () => {
  it('defaults missing theme preference during codec decode', () => {
    const olderValue = settingsCodec.createDefault().value;
    const encoded = settingsCodec.encode({
      schemaVersion: 1,
      revision: 0,
      value: {
        ...olderValue,
        themePreference: undefined as never,
      },
    });
    const decoded = settingsCodec.decode(encoded);
    expect(decoded.ok).toBe(true);
    if (decoded.ok) {
      expect(decoded.value.value.themePreference).toBe('system');
    }
  });
});
