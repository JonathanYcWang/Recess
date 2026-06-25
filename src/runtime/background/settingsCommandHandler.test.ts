import { describe, expect, it } from 'vitest';
import { createInMemoryKeyValueAdapter } from '@/adapters/browser/in-memory/inMemoryKeyValueAdapter';
import { createDiagnosticRingBuffer } from '@/modules/persisted-application-state/diagnostics/diagnosticRingBuffer';
import { createPersistedApplicationState } from '@/modules/persisted-application-state/persistedApplicationState';
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
    protocolVersion: number;
  }> = {}
) => ({
  protocolVersion: overrides.protocolVersion ?? RUNTIME_PROTOCOL_VERSION,
  commandId: overrides.commandId ?? `cmd-${Math.random()}`,
  module: 'settings' as const,
  command: { kind: 'unsupported-command' },
});

const malformedCommand = {
  ok: false as const,
  error: { kind: 'malformed-command' as const, message: 'unsupported Settings command kind' },
};

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

  it('rejects unsupported command kinds without committing', async () => {
    const { handler } = await createHandler();
    const response = await handler.execute(createEnvelope());
    expect(response).toEqual(malformedCommand);

    const current = handler.current();
    expect(current).toMatchObject({
      ok: true,
      value: { revision: 0, value: { hasOnboarded: false } },
    });
  });

  it('returns the original failure response for repeated commandIds', async () => {
    const { handler } = await createHandler();
    const envelope = createEnvelope({ commandId: 'cmd-repeat-failure' });
    const first = await handler.execute(envelope);
    const second = await handler.execute(envelope);
    expect(first).toEqual(second);
    expect(first).toEqual(malformedCommand);
  });

  it('evicts completed outcomes after 256 commands', async () => {
    const { handler } = await createHandler();
    const original = await handler.execute(createEnvelope({ commandId: 'cmd-0' }));
    expect(original).toEqual(malformedCommand);

    for (let index = 1; index < COMMAND_LEDGER_LIMIT + 1; index += 1) {
      await handler.execute(createEnvelope({ commandId: `cmd-${index}` }));
    }

    const replayed = await handler.execute(createEnvelope({ commandId: 'cmd-0' }));
    expect(replayed).toEqual(malformedCommand);
  });
});
