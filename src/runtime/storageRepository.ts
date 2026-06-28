export const setExtensionStorageValue = async <Value>(key: string, value: Value): Promise<void> => {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    return;
  }

  await new Promise<void>((resolve) => {
    chrome.storage.local.set({ [key]: value }, () => {
      resolve();
    });
  });
};

export const removeExtensionStorageValue = async (key: string): Promise<void> => {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    return;
  }

  await new Promise<void>((resolve) => {
    chrome.storage.local.remove([key], () => {
      resolve();
    });
  });
};

export const setLocalStorageValue = (key: string, value: string): void => {
  localStorage.setItem(key, value);
};

export const removeLocalStorageValue = (key: string): void => {
  localStorage.removeItem(key);
};
