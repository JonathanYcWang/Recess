import type { KeyValueStorageAdapter } from '@/modules/persisted-application-state';
import type { EffectIntentRecord } from './types';

export const EFFECT_OUTCOMES_STORAGE_KEY = '__recess_effect_outcomes';

export interface EffectOutcomeStore {
  list(): Promise<EffectIntentRecord[]>;
  upsert(record: EffectIntentRecord): Promise<void>;
  getByIntentId(intentId: string): Promise<EffectIntentRecord | null>;
}

export const createEffectOutcomeStore = (adapter: KeyValueStorageAdapter): EffectOutcomeStore => {
  const readAll = async (): Promise<EffectIntentRecord[]> => {
    const stored = await adapter.get(EFFECT_OUTCOMES_STORAGE_KEY);
    if (!stored.ok || stored.value === null) {
      return [];
    }
    try {
      const parsed = JSON.parse(stored.value) as EffectIntentRecord[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const writeAll = async (records: EffectIntentRecord[]): Promise<void> => {
    const result = await adapter.set(EFFECT_OUTCOMES_STORAGE_KEY, JSON.stringify(records));
    if (!result.ok) {
      throw new Error('failed to persist effect outcomes');
    }
  };

  return {
    async list() {
      return readAll();
    },

    async upsert(record) {
      const records = await readAll();
      const index = records.findIndex((entry) => entry.intentId === record.intentId);
      if (index === -1) {
        records.push(record);
      } else {
        records[index] = record;
      }
      await writeAll(records);
    },

    async getByIntentId(intentId) {
      const records = await readAll();
      return records.find((entry) => entry.intentId === intentId) ?? null;
    },
  };
};
