import { RUNTIME_PROTOCOL_VERSION } from '../protocol/types';
import type {
  WorkStartReminderClient,
  WorkStartReminderCommandHandler,
} from '../workStartReminderTypes';

const createCommandId = (): string =>
  `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const createInProcessWorkStartReminderClient = (
  handler: WorkStartReminderCommandHandler
): WorkStartReminderClient => ({
  current: async () => handler.current(),
  command: async (envelope) => handler.execute(envelope),
  addSchedule: async (input, options) =>
    handler.execute({
      protocolVersion: RUNTIME_PROTOCOL_VERSION,
      commandId: options?.commandId ?? createCommandId(),
      module: 'work-start-reminder',
      expectedRevision: options?.expectedRevision,
      command: { kind: 'add-schedule', time: input.time, days: input.days, enabled: input.enabled },
    }),
  updateSchedule: async (id, input, options) =>
    handler.execute({
      protocolVersion: RUNTIME_PROTOCOL_VERSION,
      commandId: options?.commandId ?? createCommandId(),
      module: 'work-start-reminder',
      expectedRevision: options?.expectedRevision,
      command: {
        kind: 'update-schedule',
        id,
        time: input.time,
        days: input.days,
        enabled: input.enabled,
      },
    }),
  deleteSchedule: async (id, options) =>
    handler.execute({
      protocolVersion: RUNTIME_PROTOCOL_VERSION,
      commandId: options?.commandId ?? createCommandId(),
      module: 'work-start-reminder',
      expectedRevision: options?.expectedRevision,
      command: { kind: 'delete-schedule', id },
    }),
  toggleScheduleEnabled: async (id, options) =>
    handler.execute({
      protocolVersion: RUNTIME_PROTOCOL_VERSION,
      commandId: options?.commandId ?? createCommandId(),
      module: 'work-start-reminder',
      expectedRevision: options?.expectedRevision,
      command: { kind: 'toggle-schedule-enabled', id },
    }),
  subscribe: (listener) => handler.subscribe(listener),
});
