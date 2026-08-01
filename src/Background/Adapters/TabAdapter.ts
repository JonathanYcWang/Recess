/**
 * TabAdapter — wraps browser tab APIs.
 * Owns all browser.tabs.* and browser.runtime.sendMessage calls for the background layer.
 */

import browser from 'webextension-polyfill';

export const getAllTabs = async (): Promise<browser.Tabs.Tab[]> => browser.tabs.query({});

export const removeTabById = async (tabId: number): Promise<void> => {
  await browser.tabs.remove(tabId).catch(() => undefined);
};

export const sendMessageToTab = async (tabId: number, message: unknown): Promise<void> => {
  await browser.tabs.sendMessage(tabId, message).catch(() => undefined);
};

export const broadcastToRuntime = async (message: unknown): Promise<void> => {
  await browser.runtime.sendMessage(message).catch(() => undefined);
};
