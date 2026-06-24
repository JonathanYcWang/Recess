import type { HallPassSnapshot } from '@/modules/hall-pass';
import type { HallPassCommandEnvelope, HallPassCommandError } from './protocol/hallPassCommand';
import type { HallPassRuntimeTransportError } from './messaging/hallPassMessages';
import type { RuntimeCommandResponse } from './protocol/types';

export type HallPassPublishedSnapshot = {
  revision: number;
  snapshot: HallPassSnapshot;
  hallPassEntry: string | null;
};

export type HallPassCommandResponse = RuntimeCommandResponse<
  HallPassPublishedSnapshot,
  HallPassCommandError
>;

export type HallPassClientError = HallPassCommandError | HallPassRuntimeTransportError;

export type HallPassClientCommandResult = RuntimeCommandResponse<
  HallPassPublishedSnapshot,
  HallPassClientError
>;

export type HallPassClientCurrentResult =
  | HallPassRuntimeResult
  | { ok: false; error: HallPassRuntimeTransportError };

export type HallPassRuntimeResult =
  | { ok: true; value: HallPassPublishedSnapshot }
  | { ok: false; error: HallPassCommandError };

export interface HallPassSubscribeOptions {
  onTransportLoss?: () => void;
}

export interface HallPassCommandHandler {
  current(): HallPassRuntimeResult;
  execute(envelope: unknown): Promise<HallPassCommandResponse>;
  subscribe(listener: (snapshot: HallPassPublishedSnapshot) => void): () => void;
  reportBlockedAttempt(input: {
    url: string;
    requestId: string;
    reportedAtEpochMs: number;
    blockListEntries: readonly string[];
    isTimeOut: boolean;
  }): Promise<HallPassCommandResponse>;
}

export interface HallPassClient {
  current(): Promise<HallPassClientCurrentResult>;
  command(envelope: HallPassCommandEnvelope): Promise<HallPassClientCommandResult>;
  confirmGrant(
    requestId: string,
    options?: { commandId?: string; expectedRevision?: number; passId?: string }
  ): Promise<HallPassClientCommandResult>;
  cancelPending(
    requestId?: string,
    options?: { commandId?: string; expectedRevision?: number }
  ): Promise<HallPassClientCommandResult>;
  subscribe(
    listener: (snapshot: HallPassPublishedSnapshot) => void,
    options?: HallPassSubscribeOptions
  ): () => void;
}
