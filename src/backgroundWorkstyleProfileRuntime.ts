import { registerWorkstyleProfileRuntimeListener } from './runtime/background/workstyleProfileRuntimeListener';
import { createChromiumKeyValueAdapter } from '@/adapters/browser/chromium/chromiumKeyValueAdapter';

if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage && chrome.runtime?.onConnect) {
  registerWorkstyleProfileRuntimeListener({
    adapter: createChromiumKeyValueAdapter(),
    runtime: chrome.runtime,
  });
}
