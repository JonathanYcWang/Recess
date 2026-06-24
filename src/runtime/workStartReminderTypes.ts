import type { VersionedDocument } from '@/modules/persisted-application-state';
import type {
  WorkStartReminderSnapshot,
  WorkStartReminderValue,
} from '@/modules/work-start-reminder';
import type {
  WorkStartReminderCommandEnvelope,
  WorkStartReminderCommandError,
} from './protocol/workStartReminderCommand';
import type { WorkStartReminderRuntimeTransportError } from './messaging/workStartReminderMessages';
import type { RuntimeCommandResponse } from './protocol/types';

export type WorkStartReminderDocumentSnapshot = VersionedDocument<WorkStartReminderValue>;

export type WorkStartReminderPublishedSnapshot = {
  revision: number;
  snapshot: WorkStartReminderSnapshot;
};

export type WorkStartReminderCommandResponse = RuntimeCommandResponse<
  WorkStartReminderPublishedSnapshot,
  WorkStartReminderCommandError
>;

export type WorkStartReminderClientError =
  | WorkStartReminderCommandError
  | WorkStartReminderRuntimeTransportError;

export type WorkStartReminderClientCommandResult = RuntimeCommandResponse<
  WorkStartReminderPublishedSnapshot,
  WorkStartReminderClientError
>;

export type WorkStartReminderClientCurrentResult =
  | WorkStartReminderRuntimeResult
  | { ok: false; error: WorkStartReminderRuntimeTransportError };

export type WorkStartReminderRuntimeResult =
  | { ok: true; value: WorkStartReminderPublishedSnapshot }
  | { ok: false; error: WorkStartReminderCommandError };

export interface WorkStartReminderSubscribeOptions {
  onTransportLoss?: () => void;
}

export interface WorkStartReminderCommandHandler {
  current(): WorkStartReminderRuntimeResult;
  execute(envelope: unknown): Promise<WorkStartReminderCommandResponse>;
  subscribe(listener: (snapshot: WorkStartReminderPublishedSnapshot) => void): () => void;
  reconcileDueReminder(alarmName: string): Promise<WorkStartReminderCommandResponse | null>;
  bootstrapPlanning(): Promise<void>;
}

export interface WorkStartReminderClient {
  current(): Promise<WorkStartReminderClientCurrentResult>;
  command(
    envelope: WorkStartReminderCommandEnvelope
  ): Promise<WorkStartReminderClientCommandResult>;
  addSchedule(
    input: { time: string; days: boolean[]; enabled?: boolean },
    options?: { commandId?: string; expectedRevision?: number }
  ): Promise<WorkStartReminderClientCommandResult>;
  updateSchedule(
    id: string,
    input: { time: string; days: boolean[]; enabled?: boolean },
    options?: { commandId?: string; expectedRevision?: number }
  ): Promise<WorkStartReminderClientCommandResult>;
  deleteSchedule(
    id: string,
    options?: { commandId?: string; expectedRevision?: number }
  ): Promise<WorkStartReminderClientCommandResult>;
  toggleScheduleEnabled(
    id: string,
    options?: { commandId?: string; expectedRevision?: number }
  ): Promise<WorkStartReminderClientCommandResult>;
  subscribe(
    listener: (snapshot: WorkStartReminderPublishedSnapshot) => void,
    options?: WorkStartReminderSubscribeOptions
  ): () => void;
}
