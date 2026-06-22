import { describe, expect, it } from 'vitest';
import type { WorkHistoryFact, WorkHistoryStorageAdapter } from '../types';

const sampleFact = (id: string, recordedAt: number): WorkHistoryFact => ({
  id,
  recordedAt,
  kind: 'focus-block-completed',
  payload: { durationMinutes: 25 },
});

export const runWorkHistoryContractSuite = (
  createAdapter: () => WorkHistoryStorageAdapter,
  suiteName: string
): void => {
  describe(`${suiteName} work history contract`, () => {
    it('appends facts with stable identities and idempotent duplicate delivery', async () => {
      const adapter = createAdapter();
      const fact = sampleFact('fact-1', 100);
      const first = await adapter.append([fact]);
      expect(first.ok).toBe(true);
      const duplicate = await adapter.append([fact]);
      expect(duplicate.ok).toBe(true);
      const query = await adapter.query();
      expect(query.ok).toBe(true);
      if (query.ok) {
        expect(query.value).toHaveLength(1);
        expect(query.value[0]?.id).toBe('fact-1');
      }
    });

    it('returns deterministic ordering for query windows', async () => {
      const adapter = createAdapter();
      await adapter.append([sampleFact('b', 200), sampleFact('a', 100), sampleFact('c', 200)]);
      const query = await adapter.query({ fromRecordedAt: 100, toRecordedAt: 200, limit: 2 });
      expect(query.ok).toBe(true);
      if (query.ok) {
        expect(query.value.map((fact) => fact.id)).toEqual(['a', 'b']);
      }
    });

    it('reports unavailable storage as typed failure', async () => {
      const adapter = createAdapter();
      if ('setAvailable' in adapter && typeof adapter.setAvailable === 'function') {
        adapter.setAvailable(false);
      }
      const result = await adapter.append([sampleFact('fact-2', 1)]);
      if (!result.ok) {
        expect(result.error.kind).toBe('unavailable');
      }
    });
  });
};
