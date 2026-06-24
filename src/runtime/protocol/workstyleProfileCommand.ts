import { RUNTIME_PROTOCOL_VERSION } from './types';
import type { RuntimeCommandEnvelope } from './types';
import type { WorkstyleProfileDecisionError } from '@/modules/workstyle-profile';

export type WorkstyleProfileCommand =
  | { kind: 'update-energy'; energy: unknown }
  | { kind: 'update-momentum'; momentum: unknown }
  | { kind: 'update-preferred-cadence'; cadence: unknown }
  | { kind: 'update-friction'; dimension: unknown; level: unknown }
  | {
      kind: 'initialize-from-onboarding';
      energy: unknown;
      cadence: unknown;
      primaryFriction: unknown;
    }
  | { kind: 'assign-pet'; petId: unknown };

export type WorkstyleProfileCommandError =
  | { kind: 'unsupported-protocol'; supportedVersion: number }
  | { kind: 'malformed-command'; message: string }
  | { kind: 'invalid-module'; module: string }
  | WorkstyleProfileDecisionError
  | { kind: 'stale-revision'; expectedRevision: number; actualRevision: number }
  | { kind: 'persistence-unavailable' }
  | { kind: 'persistence-failed' }
  | { kind: 'unexpected-runtime'; diagnosticId: string };

export type WorkstyleProfileCommandEnvelope = RuntimeCommandEnvelope<WorkstyleProfileCommand>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const parseCommand = (command: unknown): WorkstyleProfileCommand | null => {
  if (!isRecord(command) || typeof command.kind !== 'string') {
    return null;
  }
  switch (command.kind) {
    case 'update-energy':
      return { kind: 'update-energy', energy: command.energy };
    case 'update-momentum':
      return { kind: 'update-momentum', momentum: command.momentum };
    case 'update-preferred-cadence':
      return { kind: 'update-preferred-cadence', cadence: command.cadence };
    case 'update-friction':
      return {
        kind: 'update-friction',
        dimension: command.dimension,
        level: command.level,
      };
    case 'initialize-from-onboarding':
      return {
        kind: 'initialize-from-onboarding',
        energy: command.energy,
        cadence: command.cadence,
        primaryFriction: command.primaryFriction,
      };
    case 'assign-pet':
      return { kind: 'assign-pet', petId: command.petId };
    default:
      return null;
  }
};

export const decodeWorkstyleProfileCommandEnvelope = (
  envelope: unknown
):
  | { ok: true; value: WorkstyleProfileCommandEnvelope }
  | { ok: false; error: WorkstyleProfileCommandError } => {
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
  if (candidate.module !== 'workstyle-profile') {
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
      error: { kind: 'malformed-command', message: 'unsupported Workstyle Profile command kind' },
    };
  }

  return {
    ok: true,
    value: {
      protocolVersion: candidate.protocolVersion,
      commandId: candidate.commandId,
      module: 'workstyle-profile',
      expectedRevision: candidate.expectedRevision,
      command,
    },
  };
};
