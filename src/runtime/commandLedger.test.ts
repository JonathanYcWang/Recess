import { describe, expect, it } from 'vitest';
import { COMMAND_LEDGER_LIMIT, createCommandLedger } from '@/runtime/commandLedger';

describe('command ledger', () => {
  it('evicts the oldest completed outcome deterministically', () => {
    const ledger = createCommandLedger<{ ok: true; value: number }>();

    for (let index = 0; index < COMMAND_LEDGER_LIMIT + 3; index += 1) {
      ledger.set(`cmd-${index}`, { ok: true, value: index });
    }

    expect(ledger.size()).toBe(COMMAND_LEDGER_LIMIT);
    expect(ledger.get('cmd-0')).toBeUndefined();
    expect(ledger.get('cmd-1')).toBeUndefined();
    expect(ledger.get('cmd-2')).toBeUndefined();
    expect(ledger.get(`cmd-${COMMAND_LEDGER_LIMIT + 2}`)).toEqual({
      ok: true,
      value: COMMAND_LEDGER_LIMIT + 2,
    });
  });

  it('returns the original response for a repeated commandId', () => {
    const ledger = createCommandLedger<{ ok: true; value: string }>();
    const response = { ok: true as const, value: 'first' };
    ledger.set('cmd-repeat', response);
    ledger.set('cmd-repeat', { ok: true, value: 'second' });

    expect(ledger.get('cmd-repeat')).toEqual(response);
  });
});
