import type { WorkRhythmClient, WorkRhythmClientCommandResult } from '@/runtime/workRhythmTypes';
import {
  getWorkRhythmConnectionManager,
  isWorkRhythmTransportError,
} from './workRhythmConnectionManager';

const transportUnavailable = (): WorkRhythmClientCommandResult => ({
  ok: false,
  error: { kind: 'transport-unavailable' },
});

export const createConnectionAwareWorkRhythmClient = (
  client: WorkRhythmClient
): WorkRhythmClient => ({
  current: () => client.current(),
  subscribe: (listener, options) => client.subscribe(listener, options),
  command: async (envelope) => {
    const manager = getWorkRhythmConnectionManager();
    if (manager?.getConnectionState() === 'disconnected') {
      return transportUnavailable();
    }
    const result = await client.command(envelope);
    if (!result.ok && isWorkRhythmTransportError(result.error)) {
      manager?.markDisconnected();
    }
    return result;
  },
  selectTasks: async (taskIds, options) => {
    const manager = getWorkRhythmConnectionManager();
    if (manager?.getConnectionState() === 'disconnected') {
      return transportUnavailable();
    }
    const result = await client.selectTasks(taskIds, options);
    if (!result.ok && isWorkRhythmTransportError(result.error)) {
      manager?.markDisconnected();
    }
    return result;
  },
  setActiveTask: async (taskId, options) => {
    const manager = getWorkRhythmConnectionManager();
    if (manager?.getConnectionState() === 'disconnected') {
      return transportUnavailable();
    }
    const result = await client.setActiveTask(taskId, options);
    if (!result.ok && isWorkRhythmTransportError(result.error)) {
      manager?.markDisconnected();
    }
    return result;
  },
  completeTask: async (taskId, options) => {
    const manager = getWorkRhythmConnectionManager();
    if (manager?.getConnectionState() === 'disconnected') {
      return transportUnavailable();
    }
    const result = await client.completeTask(taskId, options);
    if (!result.ok && isWorkRhythmTransportError(result.error)) {
      manager?.markDisconnected();
    }
    return result;
  },
});
