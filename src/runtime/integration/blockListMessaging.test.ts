import { createInMemoryKeyValueAdapter } from '@/adapters/browser/in-memory/inMemoryKeyValueAdapter';
import { createBackgroundCompositionRoot } from '../background/backgroundCompositionRoot';
import { describeBlockListClientContractTests } from './blockListClientContractTests';

describeBlockListClientContractTests('in-process', async () => {
  const adapter = createInMemoryKeyValueAdapter();
  const root = await createBackgroundCompositionRoot({ adapter });
  if (!root.ok) {
    throw new Error('expected composition root to initialize');
  }
  return root.value.blockList;
});
