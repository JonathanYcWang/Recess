/**
 * StorageRepository — the only writer/reader to browser storage.
 * All storage access routes through this repository.
 */

const read = async <T>(key: string): Promise<T | undefined> => {
  const result = await chrome.storage.local.get(key);
  return result[key] as T | undefined;
};

const write = async <T>(key: string, value: T): Promise<void> => {
  await chrome.storage.local.set({ [key]: value });
};

const remove = async (key: string): Promise<void> => {
  await chrome.storage.local.remove(key);
};

export const storageRepository = { read, write, remove };
