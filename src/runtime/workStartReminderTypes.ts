export type WorkStartReminderValue = {
  startsAt: string | null;
};

export type WorkStartReminderSnapshot = WorkStartReminderValue;

export type WorkStartReminderDocumentSnapshot = {
  revision: number;
  snapshot: WorkStartReminderSnapshot;
};

export type WorkStartReminderPublishedSnapshot = {
  revision: number;
  snapshot: WorkStartReminderSnapshot;
};

export type WorkStartReminderCommandError = 'invalid-command' | 'not-found' | 'conflict';

export type WorkStartReminderRuntimeTransportError = 'transport-unavailable' | 'timeout';

export type RuntimeCommandResponse<T, E> = { ok: true; value: T } | { ok: false; error: E };

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
  applyWorkSessionStarted(input: {
    workSessionId: string;
    startedAtEpochMs: number;
  }): Promise<WorkStartReminderCommandResponse>;
}

export interface WorkStartReminderClient {
  current(): Promise<WorkStartReminderClientCurrentResult>;
  command(envelope: unknown): Promise<WorkStartReminderClientCommandResult>;
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
  skipNext(options?: {
    commandId?: string;
    expectedRevision?: number;
  }): Promise<WorkStartReminderClientCommandResult>;
  subscribe(
    listener: (snapshot: WorkStartReminderPublishedSnapshot) => void,
    options?: WorkStartReminderSubscribeOptions
  ): () => void;
}
