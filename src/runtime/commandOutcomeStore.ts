import type { KeyValueStorageAdapter } from '@/runtime/persistence';
import type { DomainModuleName } from '@/runtime/protocol/types';

export const COMMAND_OUTCOMES_STORAGE_KEY = '__recess_command_outcomes';
export const COMMAND_OUTCOME_LIMIT = 256;

type StoredCommandOutcome<TResponse> = {
  module: DomainModuleName;
  commandId: string;
  sequence: number;
  response: TResponse;
};

export interface CommandOutcomeStore<TResponse> {
  get(module: DomainModuleName, commandId: string): Promise<TResponse | undefined>;
  set(module: DomainModuleName, commandId: string, response: TResponse): Promise<void>;
  list(module: DomainModuleName): Promise<Array<{ commandId: string; response: TResponse }>>;
}

export const createCommandOutcomeStore = <TResponse>(
  adapter: KeyValueStorageAdapter
): CommandOutcomeStore<TResponse> => {
  let sequence = 0;

  const readAll = async (): Promise<StoredCommandOutcome<TResponse>[]> => {
    const stored = await adapter.get(COMMAND_OUTCOMES_STORAGE_KEY);
    if (!stored.ok || stored.value === null) {
      return [];
    }
    try {
      const parsed = JSON.parse(stored.value) as StoredCommandOutcome<TResponse>[];
      if (!Array.isArray(parsed)) {
        return [];
      }
      sequence = parsed.reduce((max, entry) => Math.max(max, entry.sequence), -1) + 1;
      return parsed;
    } catch {
      return [];
    }
  };

  const writeAll = async (records: StoredCommandOutcome<TResponse>[]): Promise<void> => {
    const result = await adapter.set(COMMAND_OUTCOMES_STORAGE_KEY, JSON.stringify(records));
    if (!result.ok) {
      throw new Error('failed to persist command outcomes');
    }
  };

  const evict = (records: StoredCommandOutcome<TResponse>[]): StoredCommandOutcome<TResponse>[] => {
    if (records.length <= COMMAND_OUTCOME_LIMIT) {
      return records;
    }
    return [...records]
      .sort((left, right) => left.sequence - right.sequence)
      .slice(records.length - COMMAND_OUTCOME_LIMIT);
  };

  return {
    async get(module, commandId) {
      const records = await readAll();
      return records.find((entry) => entry.module === module && entry.commandId === commandId)
        ?.response;
    },

    async set(module, commandId, response) {
      const records = await readAll();
      if (records.some((entry) => entry.module === module && entry.commandId === commandId)) {
        return;
      }
      records.push({
        module,
        commandId,
        response,
        sequence: sequence++,
      });
      await writeAll(evict(records));
    },

    async list(module) {
      const records = await readAll();
      return records
        .filter((entry) => entry.module === module)
        .map((entry) => ({ commandId: entry.commandId, response: entry.response }));
    },
  };
};
