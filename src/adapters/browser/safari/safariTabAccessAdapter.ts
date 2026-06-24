import type { TabAccess } from '@/modules/block-list-enforcement';
import { createChromiumTabAccessAdapter } from '../chromium/chromiumTabAccessAdapter';

export const createSafariCompatibleTabAccessAdapter = (): TabAccess | null => {
  if (typeof chrome === 'undefined' || !chrome.tabs) {
    return null;
  }
  return createChromiumTabAccessAdapter();
};
