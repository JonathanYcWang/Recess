import { describe, expect, it } from 'vitest';
import { createInMemoryWorkHistoryAdapter } from '@/adapters/browser/in-memory/inMemoryWorkHistoryAdapter';
import { runWorkHistoryContractSuite } from '@/modules/work-history';

runWorkHistoryContractSuite(createInMemoryWorkHistoryAdapter, 'in-memory');

describe('in-memory work history adapter', () => {
  it('rejects invalid facts with typed outcomes', async () => {
    const adapter = createInMemoryWorkHistoryAdapter();
    const result = await adapter.append([
      {
        id: '',
        recordedAt: Number.NaN,
        kind: 'work-session-started',
        payload: {},
      },
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('invalid-fact');
    }
  });
});
