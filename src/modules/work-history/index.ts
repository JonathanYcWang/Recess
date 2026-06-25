export type {
  WorkHistoryFact,
  WorkHistoryFactKind,
  WorkHistoryQuery,
  WorkHistoryService,
  WorkHistoryStorageAdapter,
  WorkHistoryStorageError,
} from './types';

export { createWorkHistoryService, sortWorkHistoryFacts } from './types';
export {
  WORK_HISTORY_FACT_KINDS,
  WORK_HISTORY_FACT_SCHEMA_VERSION,
  effectFactsToWorkHistoryFact,
  workHistoryFactToEffectFacts,
} from './factCodec';
export {
  WORK_HISTORY_PRODUCER_MATRIX,
  assertProducerMatrixCoversDeclaredKinds,
  implementedProducerEntries,
} from './producerMatrix';
export { describeWorkHistoryIntegrationTests } from './integration/workHistory.integrationTests';
