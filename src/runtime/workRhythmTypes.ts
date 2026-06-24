import type { WorkRhythmSnapshot } from '@/modules/work-rhythm';
import type {
  WorkRhythmCommandEnvelope,
  WorkRhythmCommandError,
} from './protocol/workRhythmCommand';
import type { WorkRhythmRuntimeTransportError } from './messaging/workRhythmMessages';
import type { RuntimeCommandResponse } from './protocol/types';

export type WorkRhythmPublishedSnapshot = {
  revision: number;
  snapshot: WorkRhythmSnapshot;
};

export type WorkRhythmCommandResponse = RuntimeCommandResponse<
  WorkRhythmPublishedSnapshot,
  WorkRhythmCommandError
>;

export type WorkRhythmClientError = WorkRhythmCommandError | WorkRhythmRuntimeTransportError;

export type WorkRhythmClientCommandResult = RuntimeCommandResponse<
  WorkRhythmPublishedSnapshot,
  WorkRhythmClientError
>;

export type WorkRhythmClientCurrentResult =
  | WorkRhythmRuntimeResult
  | { ok: false; error: WorkRhythmRuntimeTransportError };

export type WorkRhythmRuntimeError = WorkRhythmCommandError;

export type WorkRhythmRuntimeResult =
  | { ok: true; value: WorkRhythmPublishedSnapshot }
  | { ok: false; error: WorkRhythmRuntimeError };

export interface WorkRhythmCommandHandler {
  current(): WorkRhythmRuntimeResult;
  execute(envelope: unknown): Promise<WorkRhythmCommandResponse>;
  subscribe(listener: (snapshot: WorkRhythmPublishedSnapshot) => void): () => void;
  reconcileDueBoundaries(): Promise<WorkRhythmCommandResponse | null>;
}

export interface WorkRhythmClient {
  current(): Promise<WorkRhythmClientCurrentResult>;
  command(envelope: WorkRhythmCommandEnvelope): Promise<WorkRhythmClientCommandResult>;
  subscribe(
    listener: (snapshot: WorkRhythmPublishedSnapshot) => void,
    options?: { onTransportLoss?: () => void }
  ): () => void;
}
