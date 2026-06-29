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

export type WorkStartReminderActionError = 'invalid-action' | 'not-found' | 'conflict';

export type WorkStartReminderRuntimeTransportError = 'transport-unavailable' | 'timeout';

export type RuntimeActionResponse<T, E> = { ok: true; value: T } | { ok: false; error: E };

export type WorkStartReminderActionResponse = RuntimeActionResponse<
  WorkStartReminderPublishedSnapshot,
  WorkStartReminderActionError
>;

export type WorkStartReminderClientError =
  | WorkStartReminderActionError
  | WorkStartReminderRuntimeTransportError;

export type WorkStartReminderClientActionResult = RuntimeActionResponse<
  WorkStartReminderPublishedSnapshot,
  WorkStartReminderClientError
>;

export type WorkStartReminderClientCurrentResult =
  | WorkStartReminderRuntimeResult
  | { ok: false; error: WorkStartReminderRuntimeTransportError };

export type WorkStartReminderRuntimeResult =
  | { ok: true; value: WorkStartReminderPublishedSnapshot }
  | { ok: false; error: WorkStartReminderActionError };

export interface WorkStartReminderSubscribeOptions {
  onTransportLoss?: () => void;
}

export interface WorkStartReminderActionHandler {
  current(): WorkStartReminderRuntimeResult;
  execute(envelope: unknown): Promise<WorkStartReminderActionResponse>;
  subscribe(listener: (snapshot: WorkStartReminderPublishedSnapshot) => void): () => void;
  reconcileDueReminder(alarmName: string): Promise<WorkStartReminderActionResponse | null>;
  bootstrapPlanning(): Promise<void>;
  applyWorkSessionStarted(input: {
    workSessionId: string;
    startedAtEpochMs: number;
  }): Promise<WorkStartReminderActionResponse>;
}

export interface WorkStartReminderClient {
  current(): Promise<WorkStartReminderClientCurrentResult>;
  action(envelope: unknown): Promise<WorkStartReminderClientActionResult>;
  addSchedule(
    input: { time: string; days: boolean[]; enabled?: boolean },
    options?: { actionId?: string; expectedRevision?: number }
  ): Promise<WorkStartReminderClientActionResult>;
  updateSchedule(
    id: string,
    input: { time: string; days: boolean[]; enabled?: boolean },
    options?: { actionId?: string; expectedRevision?: number }
  ): Promise<WorkStartReminderClientActionResult>;
  deleteSchedule(
    id: string,
    options?: { actionId?: string; expectedRevision?: number }
  ): Promise<WorkStartReminderClientActionResult>;
  toggleScheduleEnabled(
    id: string,
    options?: { actionId?: string; expectedRevision?: number }
  ): Promise<WorkStartReminderClientActionResult>;
  skipNext(options?: {
    actionId?: string;
    expectedRevision?: number;
  }): Promise<WorkStartReminderClientActionResult>;
  subscribe(
    listener: (snapshot: WorkStartReminderPublishedSnapshot) => void,
    options?: WorkStartReminderSubscribeOptions
  ): () => void;
}
