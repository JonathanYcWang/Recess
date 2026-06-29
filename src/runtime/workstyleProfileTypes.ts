import type { VersionedDocument } from '@/runtime/persistence';
import type { WorkstyleProfileValue } from '@/modules/workstyle-profile';
import type {
  WorkstyleProfileCommandEnvelope,
  WorkstyleProfileCommandError,
} from './protocol/workstyleProfileCommand';
import type { RuntimeCommandResponse } from './protocol/types';

export type WorkstyleProfileSnapshot = VersionedDocument<WorkstyleProfileValue>;

export type WorkstyleProfileCommandResponse = RuntimeCommandResponse<
  WorkstyleProfileSnapshot,
  WorkstyleProfileCommandError
>;

export type WorkstyleProfileRuntimeError = WorkstyleProfileCommandError;

export type WorkstyleProfileRuntimeResult =
  | { ok: true; value: WorkstyleProfileSnapshot }
  | { ok: false; error: WorkstyleProfileRuntimeError };

export interface WorkstyleProfileCommandHandler {
  current(): WorkstyleProfileRuntimeResult;
  execute(envelope: unknown): Promise<WorkstyleProfileCommandResponse>;
  subscribe(listener: (snapshot: WorkstyleProfileSnapshot) => void): () => void;
}

export interface WorkstyleProfileClient {
  current(): Promise<WorkstyleProfileRuntimeResult>;
  command(envelope: WorkstyleProfileCommandEnvelope): Promise<WorkstyleProfileCommandResponse>;
  subscribe(listener: (snapshot: WorkstyleProfileSnapshot) => void): () => void;
}
