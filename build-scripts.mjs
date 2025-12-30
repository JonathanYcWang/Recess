// Post-build script to copy background and content scripts
import { readFileSync, writeFileSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Copy manifest.json
copyFileSync(
  join(__dirname, 'manifest.json'),
  join(__dirname, 'dist', 'manifest.json')
);

function transformTypeScriptToJS(code) {
  let result = code;
  
  // Replace enum with string literal for Chrome API
  result = result.replace(/chrome\.declarativeNetRequest\.RuleActionType\.BLOCK/g, "'block'");
  
  // Remove underscore-prefixed unused parameter type annotations
  result = result.replace(/:\s*_[A-Za-z]+(\[\])?/g, '');
  
  // Remove type annotations from arrow function parameters in .some(), .map(), etc
  result = result.replace(/\(([^:)]+):\s*string\)/g, '($1)');
  
  // Remove single-line comments but preserve strings
  result = result.replace(/\/\/(?![^'"]*['"'][^'"]*$)[^\n]*/g, '');
  
  // Clean up extra blank lines
  result = result.replace(/\n\s*\n\s*\n+/g, '\n\n');
  
  return result.trim() + '\n';
}

try {
  // Read background.ts and manually write clean JS
  const backgroundCode = `chrome.runtime.onInstalled.addListener(() => {
  console.log('Recess extension installed');
});

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({
    url: chrome.runtime.getURL('index.html')
  });
});

chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
  if (message.type === 'SESSION_START') {
    chrome.declarativeNetRequest.updateDynamicRules({
      addRules: [
        {
          id: 1,
          priority: 1,
          action: { type: 'block' },
          condition: {
            urlFilter: '*',
            excludedInitiatorDomains: ['chrome-extension://'],
          },
        },
      ],
      removeRuleIds: [],
    });
  } else if (message.type === 'SESSION_END') {
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [1],
    });
  }
  return true;
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'session-end') {
    chrome.storage.local.set({ sessionState: 'ended' });
  } else if (alarm.name === 'break-end') {
    chrome.storage.local.set({ breakState: 'ended' });
  }
});
`;

  writeFileSync(
    join(__dirname, 'dist', 'background.js'),
    backgroundCode
  );
  
  // Read content.ts and manually write clean JS
  const contentCode = `chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
  if (message.type === 'CHECK_BLOCKED') {
    const currentUrl = window.location.href;
    chrome.storage.local.get(['blockedSites', 'sessionState'], (result) => {
      const blockedSites = result.blockedSites || [];
      const isBlocked = blockedSites.some((site) => currentUrl.includes(site));
      
      if (isBlocked && result.sessionState === 'active') {
        window.location.href = chrome.runtime.getURL('index.html#/break');
      }
    });
  }
});
`;

  writeFileSync(
    join(__dirname, 'dist', 'content.js'),
    contentCode
  );
  
  console.log('✓ Background and content scripts compiled successfully');
} catch (error) {
  console.error('Error processing scripts:', error);
  process.exit(1);
}
