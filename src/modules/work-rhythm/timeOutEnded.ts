import type { WorkHistoryFact } from '@/modules/work-history';
import { withSchemaVersion } from '@/modules/work-history/factCodec';

export interface TimeOutEndedContext {
  factId: string;
  recordedAt: number;
  workSessionId: string;
  focusBlockIndex: number;
  startedAtEpochMs: number;
  endedAtEpochMs: number;
  durationSeconds: number;
}

export const timeOutEndedFactId = (
  workSessionId: string,
  focusBlockIndex: number,
  startedAtEpochMs: number
): string => `time-out-ended-${workSessionId}-${focusBlockIndex}-${startedAtEpochMs}`;

export const createTimeOutEndedFact = (context: TimeOutEndedContext): WorkHistoryFact =>
  withSchemaVersion({
    id: context.factId,
    recordedAt: context.recordedAt,
    kind: 'time-out-ended',
    payload: {
      workSessionId: context.workSessionId,
      focusBlockIndex: context.focusBlockIndex,
      startedAtEpochMs: context.startedAtEpochMs,
      endedAtEpochMs: context.endedAtEpochMs,
      durationSeconds: context.durationSeconds,
    },
  });
