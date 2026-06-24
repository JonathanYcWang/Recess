import { registerTaskListRuntimeListener } from './runtime/background/taskListRuntimeListener';
import { createChromiumKeyValueAdapter } from '@/adapters/browser/chromium/chromiumKeyValueAdapter';

if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage && chrome.runtime?.onConnect) {
  registerTaskListRuntimeListener({
    adapter: createChromiumKeyValueAdapter(),
    runtime: chrome.runtime,
  });
}
