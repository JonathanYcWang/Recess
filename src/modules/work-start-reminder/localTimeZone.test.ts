import { describe, expect, it } from 'vitest';
import { resolveLocalWallTimeOnDate, getZonedParts } from './localTimeZone';

const NEW_YORK = 'America/New_York';

describe('localTimeZone', () => {
  it('advances a spring-forward gap to the next valid local instant that day', () => {
    const resolved = resolveLocalWallTimeOnDate(2026, 3, 8, { hour: 2, minute: 30 }, NEW_YORK);
    expect(resolved?.kind).toBe('gap-advanced');
    if (!resolved || resolved.kind !== 'gap-advanced') {
      return;
    }
    expect(resolved.resolved).toEqual({ hour: 3, minute: 0 });
    const parts = getZonedParts(resolved.epochMs, NEW_YORK);
    expect(parts).toMatchObject({ year: 2026, month: 3, day: 8, hour: 3, minute: 0 });
  });

  it('resolves a fall-back repeat at the first local occurrence only', () => {
    const resolved = resolveLocalWallTimeOnDate(2026, 11, 1, { hour: 1, minute: 30 }, NEW_YORK);
    expect(resolved?.kind).toBe('repeat-first');
    if (!resolved) {
      return;
    }
    expect(getZonedParts(resolved.epochMs, NEW_YORK)).toMatchObject({
      year: 2026,
      month: 11,
      day: 1,
      hour: 1,
      minute: 30,
    });
  });
});
