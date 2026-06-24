export const RUNTIME_PROTOCOL_VERSION = 1;

export type DomainModuleName = 'settings' | 'block-list';

export interface RuntimeCommandEnvelope<TCommand> {
  protocolVersion: number;
  commandId: string;
  module: DomainModuleName;
  expectedRevision?: number;
  command: TCommand;
}

export type RuntimeCommandSuccess<TSnapshot> = {
  ok: true;
  revision: number;
  snapshot: TSnapshot;
};

export type RuntimeCommandFailure<TError> = {
  ok: false;
  error: TError;
};

export type RuntimeCommandResponse<TSnapshot, TError> =
  | RuntimeCommandSuccess<TSnapshot>
  | RuntimeCommandFailure<TError>;
