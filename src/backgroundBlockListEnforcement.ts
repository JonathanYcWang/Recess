import { registerBlockListEnforcement } from './runtime/background/backgroundBlockListEnforcement';

if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage && chrome.runtime?.onConnect) {
  registerBlockListEnforcement();
}
