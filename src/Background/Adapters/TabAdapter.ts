/**
 * TabAdapter — wraps browser tab APIs.
 * Owns all browser.tabs.* and browser.runtime.sendMessage calls for the background layer.
 */

import browser from 'webextension-polyfill';
import { storageRepository } from '@/Background/Repositories/StorageRepository';
import { findBlockListEntry } from '@/Background/Services/BlockListManagement/BlockListManagementService';

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

export const registerBlockedTabEnforcementOnTabUpdates = () => {
  browser.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
    if (!changeInfo.url) {
      return;
    }

    const state = await storageRepository.readAppState();
    const entry = findBlockListEntry(state.blockList, changeInfo.url);

    if (entry?.isBlocked) {
      await removeTabById(tabId);
    }
  });
};
