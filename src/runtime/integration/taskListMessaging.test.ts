import { createInMemoryKeyValueAdapter } from '@/adapters/browser/in-memory/inMemoryKeyValueAdapter';
import { createBackgroundCompositionRoot } from '../background/backgroundCompositionRoot';
import { describeTaskListClientContractTests } from './taskListClientContractTests';

describeTaskListClientContractTests('in-process', async () => {
  const adapter = createInMemoryKeyValueAdapter();
  const root = await createBackgroundCompositionRoot({ adapter });
  if (!root.ok) {
    throw new Error('expected composition root to initialize');
  }
  return root.value.taskList;
});
