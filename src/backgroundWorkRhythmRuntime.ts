import { registerWorkRhythmRuntimeListener } from './runtime/background/workRhythmRuntimeListener';
import { createChromiumKeyValueAdapter } from '@/adapters/browser/chromium/chromiumKeyValueAdapter';
import { getSharedBackgroundCompositionRoot } from './runtime/background/sharedCompositionRoot';

const WORK_RHYTHM_FOCUS_ALARM_PREFIX = 'work-rhythm-focus-';
const WORK_RHYTHM_WIND_DOWN_ALARM_PREFIX = 'work-rhythm-wind-down-';

if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage && chrome.runtime?.onConnect) {
  const adapter = createChromiumKeyValueAdapter();
  registerWorkRhythmRuntimeListener({
    adapter,
    runtime: chrome.runtime,
  });

  if (chrome.alarms?.onAlarm) {
    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name.startsWith(WORK_RHYTHM_FOCUS_ALARM_PREFIX)) {
        void getSharedBackgroundCompositionRoot(adapter).then((root) => {
          if (!root.ok) {
            return;
          }
          void root.value.workRhythmHandler.reconcileDueBoundaries();
        });
        return;
      }
      if (alarm.name.startsWith(WORK_RHYTHM_WIND_DOWN_ALARM_PREFIX)) {
        void getSharedBackgroundCompositionRoot(adapter).then((root) => {
          if (!root.ok) {
            return;
          }
          void root.value.workRhythmHandler.reconcileWindDownSignals();
        });
      }
    });
  }
}
