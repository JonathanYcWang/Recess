export type {
  WorkHistoryFact,
  WorkHistoryFactKind,
  WorkHistoryQuery,
  WorkHistoryService,
  WorkHistoryStorageAdapter,
  WorkHistoryStorageError,
} from './types';

export { createWorkHistoryService, sortWorkHistoryFacts } from './types';
export { describeWorkHistoryIntegrationTests } from './integration/workHistory.integrationTests';
