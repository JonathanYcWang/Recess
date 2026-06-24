import { registerWorkStartReminderRuntimeListener } from './runtime/background/workStartReminderRuntimeListener';
import { createChromiumKeyValueAdapter } from '@/adapters/browser/chromium/chromiumKeyValueAdapter';
import { getSharedBackgroundCompositionRoot } from './runtime/background/sharedCompositionRoot';
import { WORK_START_REMINDER_ALARM_PREFIX } from '@/modules/work-start-reminder';

if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage && chrome.runtime?.onConnect) {
  const adapter = createChromiumKeyValueAdapter();
  registerWorkStartReminderRuntimeListener({
    adapter,
    runtime: chrome.runtime,
  });

  if (chrome.alarms?.onAlarm) {
    chrome.alarms.onAlarm.addListener((alarm) => {
      if (!alarm.name.startsWith(WORK_START_REMINDER_ALARM_PREFIX)) {
        return;
      }
      void getSharedBackgroundCompositionRoot(adapter).then((root) => {
        if (!root.ok) {
          return;
        }
        void root.value.workStartReminderHandler.reconcileDueReminder(alarm.name);
      });
    });
  }

  chrome.notifications?.onButtonClicked?.addListener((notifId, btnIdx) => {
    if (btnIdx === 0 && notifId.startsWith('occ-')) {
      chrome.windows?.create?.({
        url: chrome.runtime.getURL('index.html'),
        type: 'popup',
        width: 420,
        height: 720,
      });
      chrome.notifications.clear(notifId);
    }
  });
}
