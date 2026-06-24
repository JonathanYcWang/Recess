import { registerHallPassRuntimeListener } from './runtime/background/hallPassRuntimeListener';
import { createChromiumKeyValueAdapter } from '@/adapters/browser/chromium/chromiumKeyValueAdapter';

if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage && chrome.runtime?.onConnect) {
  registerHallPassRuntimeListener({
    adapter: createChromiumKeyValueAdapter(),
    runtime: chrome.runtime,
  });
}
