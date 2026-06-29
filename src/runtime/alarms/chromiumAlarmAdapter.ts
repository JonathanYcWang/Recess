import type { Result } from '@/runtime/persistence';
import type { AlarmAdapter, AlarmSchedule } from './types';

type ChromeAlarmsApi = {
  create(name: string, info: { when: number }): void;
  clear(name: string, callback?: () => void): void;
  getAll(callback: (alarms: Array<{ name: string; scheduledTime?: number }>) => void): void;
  lastError?: { message?: string };
};

export const createChromiumAlarmAdapter = (alarms: ChromeAlarmsApi): AlarmAdapter => ({
  async schedule(alarm: AlarmSchedule): Promise<Result<void, import('./types').AlarmError>> {
    try {
      alarms.create(alarm.name, { when: alarm.whenEpochMs });
      if (alarms.lastError?.message) {
        return { ok: false, error: { kind: 'schedule-failed', cause: alarms.lastError.message } };
      }
      return { ok: true, value: undefined };
    } catch (cause) {
      return { ok: false, error: { kind: 'schedule-failed', cause } };
    }
  },
  async clear(name: string): Promise<Result<void, import('./types').AlarmError>> {
    return new Promise((resolve) => {
      try {
        alarms.clear(name, () => {
          if (alarms.lastError?.message) {
            resolve({
              ok: false,
              error: { kind: 'clear-failed', cause: alarms.lastError.message },
            });
            return;
          }
          resolve({ ok: true, value: undefined });
        });
      } catch (cause) {
        resolve({ ok: false, error: { kind: 'clear-failed', cause } });
      }
    });
  },
  async listAll(): Promise<Result<readonly AlarmSchedule[], import('./types').AlarmError>> {
    return new Promise((resolve) => {
      try {
        alarms.getAll((items) => {
          if (alarms.lastError?.message) {
            resolve({ ok: false, error: { kind: 'list-failed', cause: alarms.lastError.message } });
            return;
          }
          resolve({
            ok: true,
            value: items
              .filter((item) => typeof item.scheduledTime === 'number')
              .map((item) => ({
                name: item.name,
                whenEpochMs: item.scheduledTime as number,
              })),
          });
        });
      } catch (cause) {
        resolve({ ok: false, error: { kind: 'list-failed', cause } });
      }
    });
  },
});

export const createSafariCompatibleAlarmAdapter = (): AlarmAdapter | null => {
  const browserAlarms = (globalThis as { browser?: { alarms?: unknown } }).browser?.alarms;
  if (
    browserAlarms &&
    typeof (browserAlarms as ChromeAlarmsApi).create === 'function' &&
    typeof (browserAlarms as ChromeAlarmsApi).clear === 'function' &&
    typeof (browserAlarms as ChromeAlarmsApi).getAll === 'function'
  ) {
    return createChromiumAlarmAdapter(browserAlarms as ChromeAlarmsApi);
  }
  const chromeAlarms = globalThis.chrome?.alarms;
  if (
    chromeAlarms &&
    typeof chromeAlarms.create === 'function' &&
    typeof chromeAlarms.clear === 'function' &&
    typeof chromeAlarms.getAll === 'function'
  ) {
    return createChromiumAlarmAdapter(chromeAlarms as ChromeAlarmsApi);
  }
  return null;
};
