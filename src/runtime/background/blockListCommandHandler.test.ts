import { describe, expect, it } from 'vitest';
import { createInMemoryKeyValueAdapter } from '@/adapters/browser/in-memory/inMemoryKeyValueAdapter';
import { createBackgroundCompositionRoot } from '../background/backgroundCompositionRoot';

describe('blockListCommandHandler', () => {
  it('adds and removes entries through one handler path', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const root = await createBackgroundCompositionRoot({ adapter });
    if (!root.ok) {
      throw new Error('expected root');
    }

    const added = await root.value.blockList.addEntry('handler.test');
    expect(added.ok).toBe(true);

    const removed = await root.value.blockList.removeEntry('handler.test');
    expect(removed.ok).toBe(true);
  });

  it('returns typed duplicate errors from the domain module', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const root = await createBackgroundCompositionRoot({ adapter });
    if (!root.ok) {
      throw new Error('expected root');
    }

    await root.value.blockList.addEntry('dup.test');
    const duplicate = await root.value.blockList.addEntry('dup.test');
    expect(duplicate).toMatchObject({
      ok: false,
      error: { kind: 'duplicate-entry' },
    });
  });
});
