import type { EffectAdapter, EffectExecutorHooks, EffectIntent, EffectIntentRecord } from './types';
import type { EffectOutcomeStore } from './effectOutcomeStore';

export interface EffectExecutor {
  persistTransition(input: {
    intent: EffectIntent;
    outcomeRevision: number;
  }): Promise<EffectIntentRecord>;
  executeIntent(intentId: string): Promise<EffectIntentRecord | null>;
  rollForwardPending(): Promise<EffectIntentRecord[]>;
}

export const createEffectExecutor = (options: {
  store: EffectOutcomeStore;
  adapters: EffectAdapter[];
  hooks?: EffectExecutorHooks;
}): EffectExecutor => {
  const adapterFor = (kind: string): EffectAdapter | undefined =>
    options.adapters.find((adapter) => adapter.kind === kind);

  const persistRecord = async (record: EffectIntentRecord): Promise<EffectIntentRecord> => {
    await options.store.upsert(record);
    return record;
  };

  const executeRecord = async (record: EffectIntentRecord): Promise<EffectIntentRecord> => {
    if (record.phase === 'completed') {
      return record;
    }

    const adapter = adapterFor(record.kind);
    if (!adapter) {
      throw new Error(`no adapter registered for effect kind ${record.kind}`);
    }

    await options.hooks?.beforeExecute?.(record);

    const pendingExecution: EffectIntentRecord = {
      ...record,
      phase: 'pending-execution',
    };
    await persistRecord(pendingExecution);

    const result = await adapter.execute(record);
    if (!result.ok) {
      throw new Error(result.error);
    }

    await options.hooks?.afterExternalSuccess?.(record);

    const pendingCompletion: EffectIntentRecord = {
      ...record,
      phase: 'pending-completion',
    };
    await persistRecord(pendingCompletion);

    await options.hooks?.beforeMarkComplete?.(record);

    const completed: EffectIntentRecord = {
      ...record,
      phase: 'completed',
    };
    return persistRecord(completed);
  };

  return {
    async persistTransition(input) {
      const record: EffectIntentRecord = {
        ...input.intent,
        phase: 'pending-execution',
        outcomeRevision: input.outcomeRevision,
      };
      return persistRecord(record);
    },

    async executeIntent(intentId) {
      const record = await options.store.getByIntentId(intentId);
      if (!record) {
        return null;
      }
      return executeRecord(record);
    },

    async rollForwardPending() {
      const records = await options.store.list();
      const completed: EffectIntentRecord[] = [];
      for (const record of records) {
        if (record.phase === 'completed') {
          continue;
        }
        completed.push(await executeRecord(record));
      }
      return completed;
    },
  };
};
