import { registerWorkRhythmRuntimeListener } from './runtime/background/workRhythmRuntimeListener';
import { createChromiumKeyValueAdapter } from '@/adapters/browser/chromium/chromiumKeyValueAdapter';
import { getSharedBackgroundCompositionRoot } from './runtime/background/sharedCompositionRoot';

const WORK_RHYTHM_ALARM_PREFIX = 'work-rhythm-focus-';

if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage && chrome.runtime?.onConnect) {
  const adapter = createChromiumKeyValueAdapter();
  registerWorkRhythmRuntimeListener({
    adapter,
    runtime: chrome.runtime,
  });

  if (chrome.alarms?.onAlarm) {
    chrome.alarms.onAlarm.addListener((alarm) => {
      if (!alarm.name.startsWith(WORK_RHYTHM_ALARM_PREFIX)) {
        return;
      }
      void getSharedBackgroundCompositionRoot(adapter).then((root) => {
        if (!root.ok) {
          return;
        }
        void root.value.workRhythmHandler.reconcileDueBoundaries();
      });
    });
  }
}
