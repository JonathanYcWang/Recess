import { registerInsightsRuntimeListener } from './runtime/background/insightsRuntimeListener';
import { createChromiumKeyValueAdapter } from '@/adapters/browser/chromium/chromiumKeyValueAdapter';

if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage && chrome.runtime?.onConnect) {
  registerInsightsRuntimeListener({
    adapter: createChromiumKeyValueAdapter(),
    runtime: chrome.runtime,
  });
}
