import { RUNTIME_PROTOCOL_VERSION } from './types';
import type { RuntimeCommandEnvelope } from './types';
import type { WorkRhythmDecisionError } from '@/modules/work-rhythm';

export type WorkRhythmCommand =
  | { kind: 'start-work-session'; goalSeconds: unknown; energy: unknown; taskIds?: unknown }
  | { kind: 'settle-focus-boundary' }
  | { kind: 'end-work-session' }
  | { kind: 'start-time-out' }
  | { kind: 'resume-from-time-out' }
  | { kind: 'decline-recess' }
  | { kind: 'start-work-session-extension'; extensionSeconds: unknown }
  | { kind: 'select-tasks'; taskIds: unknown }
  | { kind: 'set-active-task'; taskId: unknown }
  | { kind: 'complete-task'; taskId: unknown };

export type WorkRhythmCommandError =
  | { kind: 'unsupported-protocol'; supportedVersion: number }
  | { kind: 'malformed-command'; message: string }
  | { kind: 'invalid-module'; module: string }
  | WorkRhythmDecisionError
  | { kind: 'stale-revision'; expectedRevision: number; actualRevision: number }
  | { kind: 'persistence-unavailable' }
  | { kind: 'persistence-failed' }
  | { kind: 'unexpected-runtime' };

export type WorkRhythmCommandEnvelope = RuntimeCommandEnvelope<WorkRhythmCommand>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const parseTaskIds = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }
  return value.filter((taskId): taskId is string => typeof taskId === 'string' && taskId.trim().length > 0);
};

const parseCommand = (command: unknown): WorkRhythmCommand | null => {
  if (!isRecord(command) || typeof command.kind !== 'string') {
    return null;
  }
  if (command.kind === 'start-work-session') {
    return {
      kind: 'start-work-session',
      goalSeconds: command.goalSeconds,
        taskIds: parseTaskIds(command.taskIds),
      energy: command.energy,
    };
  }
  if (command.kind === 'settle-focus-boundary') {
    return { kind: 'settle-focus-boundary' };
  }
  if (command.kind === 'end-work-session') {
    return { kind: 'end-work-session' };
  }
  if (command.kind === 'start-time-out') {
    return { kind: 'start-time-out' };
  }
  if (command.kind === 'resume-from-time-out') {
    return { kind: 'resume-from-time-out' };
  }
  if (command.kind === 'decline-recess') {
    return { kind: 'decline-recess' };
  }
  if (command.kind === 'start-work-session-extension') {
    return {
      kind: 'start-work-session-extension',
      extensionSeconds: command.extensionSeconds,
    };
  }
  if (command.kind === 'select-tasks') {
    return {
      kind: 'select-tasks',
      taskIds: command.taskIds,
    };
  }
  if (command.kind === 'set-active-task') {
    return {
      kind: 'set-active-task',
      taskId: command.taskId,
    };
  }
  if (command.kind === 'complete-task') {
    return {
      kind: 'complete-task',
      taskId: command.taskId,
    };
  }
  return null;
};

export const decodeWorkRhythmCommandEnvelope = (
  envelope: unknown
):
  | { ok: true; value: WorkRhythmCommandEnvelope }
  | { ok: false; error: WorkRhythmCommandError } => {
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
  if (candidate.module !== 'work-rhythm') {
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

  const command = parseCommand(candidate.command);
  if (!command) {
    return {
      ok: false,
      error: { kind: 'malformed-command', message: 'unsupported Work rhythm command kind' },
    };
  }

  return {
    ok: true,
    value: {
      protocolVersion: candidate.protocolVersion,
      commandId: candidate.commandId,
      module: 'work-rhythm',
      expectedRevision: candidate.expectedRevision,
      command,
    },
  };
};
