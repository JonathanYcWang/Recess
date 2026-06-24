export interface AlarmSchedule {
  name: string;
  whenEpochMs: number;
}

export type AlarmError =
  | { kind: 'unavailable' }
  | { kind: 'schedule-failed'; cause?: unknown }
  | { kind: 'clear-failed'; cause?: unknown }
  | { kind: 'list-failed'; cause?: unknown };

export interface AlarmAdapter {
  schedule(
    alarm: AlarmSchedule
  ): Promise<import('@/modules/persisted-application-state').Result<void, AlarmError>>;
  clear(
    name: string
  ): Promise<import('@/modules/persisted-application-state').Result<void, AlarmError>>;
  listAll(): Promise<
    import('@/modules/persisted-application-state').Result<readonly AlarmSchedule[], AlarmError>
  >;
}
