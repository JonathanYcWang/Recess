import type {
  WorkStartReminderClient,
  WorkStartReminderClientCommandResult,
} from '@/runtime/workStartReminderTypes';
import {
  getWorkStartReminderConnectionManager,
  isWorkStartReminderTransportError,
} from './workStartReminderConnectionManager';

const transportUnavailable = (): WorkStartReminderClientCommandResult => ({
  ok: false,
  error: { kind: 'transport-unavailable' },
});

const guardCommand = async (
  run: () => Promise<WorkStartReminderClientCommandResult>
): Promise<WorkStartReminderClientCommandResult> => {
  const manager = getWorkStartReminderConnectionManager();
  if (manager?.getConnectionState() === 'disconnected') {
    return transportUnavailable();
  }
  const result = await run();
  if (!result.ok && isWorkStartReminderTransportError(result.error)) {
    manager?.markDisconnected();
  }
  return result;
};

export const createConnectionAwareWorkStartReminderClient = (
  client: WorkStartReminderClient
): WorkStartReminderClient => ({
  current: () => client.current(),
  subscribe: (listener, options) => client.subscribe(listener, options),
  command: (envelope) => guardCommand(() => client.command(envelope)),
  addSchedule: (input, options) => guardCommand(() => client.addSchedule(input, options)),
  updateSchedule: (id, input, options) =>
    guardCommand(() => client.updateSchedule(id, input, options)),
  deleteSchedule: (id, options) => guardCommand(() => client.deleteSchedule(id, options)),
  toggleScheduleEnabled: (id, options) =>
    guardCommand(() => client.toggleScheduleEnabled(id, options)),
});
