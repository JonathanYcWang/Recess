import { RUNTIME_PROTOCOL_VERSION } from './types';
import type { RuntimeCommandEnvelope } from './types';

export type WorkStartReminderCommand =
  | { kind: 'add-schedule'; time: unknown; days: unknown; enabled?: unknown }
  | { kind: 'update-schedule'; id: unknown; time: unknown; days: unknown; enabled?: unknown }
  | { kind: 'delete-schedule'; id: unknown }
  | { kind: 'toggle-schedule-enabled'; id: unknown }
  | { kind: 'skip-next' };

export type WorkStartReminderCommandError =
  | { kind: 'unsupported-protocol'; supportedVersion: number }
  | { kind: 'malformed-command'; message: string }
  | { kind: 'invalid-module'; module: string }
  | { kind: 'invalid-time-input' }
  | { kind: 'invalid-weekdays' }
  | { kind: 'schedule-not-found'; id: string }
  | { kind: 'no-planned-occurrence' }
  | { kind: 'stale-revision'; expectedRevision: number; actualRevision: number }
  | { kind: 'persistence-unavailable' }
  | { kind: 'persistence-failed' }
  | { kind: 'alarm-schedule-failed' }
  | { kind: 'notification-delivery-failed' }
  | { kind: 'unexpected-runtime'; diagnosticId: string };

export type WorkStartReminderCommandEnvelope = RuntimeCommandEnvelope<WorkStartReminderCommand>;

export const mapScheduleCommandError = (
  error: import('@/modules/work-start-reminder').ScheduleCommandError
): WorkStartReminderCommandError => error;

export const mapSkipNextCommandError = (
  error: import('@/modules/work-start-reminder').SkipNextCommandError
): WorkStartReminderCommandError => error;

export const decodeWorkStartReminderCommandEnvelope = (
  envelope: unknown
):
  | { ok: true; value: WorkStartReminderCommandEnvelope }
  | { ok: false; error: WorkStartReminderCommandError } => {
  if (!envelope || typeof envelope !== 'object') {
    return {
      ok: false,
      error: { kind: 'malformed-command', message: 'envelope must be an object' },
    };
  }

  const candidate = envelope as Record<string, unknown>;

  if (typeof candidate.protocolVersion !== 'number') {
    return {
      ok: false,
      error: { kind: 'malformed-command', message: 'protocolVersion must be a number' },
    };
  }
  if (candidate.protocolVersion !== RUNTIME_PROTOCOL_VERSION) {
    return {
      ok: false,
      error: { kind: 'unsupported-protocol', supportedVersion: RUNTIME_PROTOCOL_VERSION },
    };
  }
  if (typeof candidate.commandId !== 'string' || candidate.commandId.length === 0) {
    return {
      ok: false,
      error: { kind: 'malformed-command', message: 'commandId must be a non-empty string' },
    };
  }
  if (candidate.module !== 'work-start-reminder') {
    return {
      ok: false,
      error: { kind: 'invalid-module', module: String(candidate.module) },
    };
  }
  if (
    candidate.expectedRevision !== undefined &&
    (typeof candidate.expectedRevision !== 'number' ||
      !Number.isInteger(candidate.expectedRevision) ||
      candidate.expectedRevision < 0)
  ) {
    return {
      ok: false,
      error: {
        kind: 'malformed-command',
        message: 'expectedRevision must be a non-negative integer',
      },
    };
  }
  if (!candidate.command || typeof candidate.command !== 'object') {
    return {
      ok: false,
      error: { kind: 'malformed-command', message: 'command must be an object' },
    };
  }

  const command = candidate.command as Record<string, unknown>;
  const base = {
    protocolVersion: candidate.protocolVersion,
    commandId: candidate.commandId,
    module: 'work-start-reminder' as const,
    expectedRevision: candidate.expectedRevision,
  };

  if (command.kind === 'add-schedule') {
    return {
      ok: true,
      value: {
        ...base,
        command: {
          kind: 'add-schedule',
          time: command.time,
          days: command.days,
          enabled: command.enabled,
        },
      },
    };
  }
  if (command.kind === 'update-schedule') {
    return {
      ok: true,
      value: {
        ...base,
        command: {
          kind: 'update-schedule',
          id: command.id,
          time: command.time,
          days: command.days,
          enabled: command.enabled,
        },
      },
    };
  }
  if (command.kind === 'delete-schedule') {
    return {
      ok: true,
      value: {
        ...base,
        command: { kind: 'delete-schedule', id: command.id },
      },
    };
  }
  if (command.kind === 'toggle-schedule-enabled') {
    return {
      ok: true,
      value: {
        ...base,
        command: { kind: 'toggle-schedule-enabled', id: command.id },
      },
    };
  }
  if (command.kind === 'skip-next') {
    return {
      ok: true,
      value: {
        ...base,
        command: { kind: 'skip-next' },
      },
    };
  }

  return {
    ok: false,
    error: { kind: 'malformed-command', message: 'unsupported Work Start Reminder command kind' },
  };
};
