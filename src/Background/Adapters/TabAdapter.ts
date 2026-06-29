/**
 * TabAdapter — wraps browser tab APIs.
 * Owns all chrome.tabs.* and chrome.runtime.sendMessage calls for the background layer.
 */

export const getAllTabs = async (): Promise<chrome.tabs.Tab[]> => {
  return chrome.tabs.query({});
};

export const sendMessageToTab = async (tabId: number, message: unknown): Promise<void> => {
  await chrome.tabs.sendMessage(tabId, message).catch(() => undefined);
};

export const broadcastToRuntime = async (message: unknown): Promise<void> => {
  await chrome.runtime.sendMessage(message).catch(() => undefined);
};
