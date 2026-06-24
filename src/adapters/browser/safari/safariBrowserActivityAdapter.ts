import { createChromiumBrowserActivityAdapter } from '../chromium/chromiumBrowserActivityAdapter';
import type { BrowserActivityAdapter } from '@/modules/browser-activity/types';

export const createSafariCompatibleBrowserActivityAdapter = (): BrowserActivityAdapter | null => {
  if (typeof chrome === 'undefined' || !chrome.windows?.getLastFocused) {
    return null;
  }
  return createChromiumBrowserActivityAdapter();
};
