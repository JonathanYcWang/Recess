import { describe, expect, it } from 'vitest';
import { RUNTIME_PROTOCOL_VERSION } from '../protocol/types';
import type { SettingsClient } from '../types';

export const describeSettingsClientContractTests = (
  suiteName: string,
  createClient: () => Promise<SettingsClient>
): void => {
  describe(`settings client contract (${suiteName})`, () => {
    it('returns the current Settings snapshot', async () => {
      const client = await createClient();
      const current = await client.current();
      expect(current).toMatchObject({
        ok: true,
        value: { revision: 0, value: { hasOnboarded: false } },
      });
    });

    it('allows subscribing to snapshot updates', async () => {
      const client = await createClient();
      const unsubscribe = client.subscribe(() => undefined);
      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });

    it('rejects unsupported commands', async () => {
      const client = await createClient();
      const rejected = await client.command({
        protocolVersion: RUNTIME_PROTOCOL_VERSION,
        commandId: 'cmd-unsupported',
        module: 'settings',
        command: { kind: 'unsupported-command' },
      } as never);
      expect(rejected).toEqual({
        ok: false,
        error: { kind: 'malformed-command', message: 'unsupported Settings command kind' },
      });
    });
  });
};
