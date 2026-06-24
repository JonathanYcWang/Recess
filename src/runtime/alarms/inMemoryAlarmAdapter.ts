import type { Result } from '@/modules/persisted-application-state';
import type { AlarmAdapter, AlarmSchedule } from './types';

export const createInMemoryAlarmAdapter = (): AlarmAdapter & {
  getScheduled(): readonly AlarmSchedule[];
  fire(name: string): AlarmSchedule | undefined;
} => {
  const scheduled = new Map<string, AlarmSchedule>();

  return {
    getScheduled: () => [...scheduled.values()],
    fire(name: string) {
      const alarm = scheduled.get(name);
      scheduled.delete(name);
      return alarm;
    },
    async schedule(alarm: AlarmSchedule): Promise<Result<void, import('./types').AlarmError>> {
      scheduled.set(alarm.name, alarm);
      return { ok: true, value: undefined };
    },
    async clear(name: string): Promise<Result<void, import('./types').AlarmError>> {
      scheduled.delete(name);
      return { ok: true, value: undefined };
    },
    async listAll(): Promise<Result<readonly AlarmSchedule[], import('./types').AlarmError>> {
      return { ok: true, value: [...scheduled.values()] };
    },
  };
};
