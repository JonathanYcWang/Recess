import { registerBlockListRuntimeListener } from './runtime/background/blockListRuntimeListener';
import { createChromiumKeyValueAdapter } from '@/adapters/browser/chromium/chromiumKeyValueAdapter';

if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage && chrome.runtime?.onConnect) {
  registerBlockListRuntimeListener({
    adapter: createChromiumKeyValueAdapter(),
    runtime: chrome.runtime,
  });
}
