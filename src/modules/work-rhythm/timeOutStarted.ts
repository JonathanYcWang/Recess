import type { WorkHistoryFact } from '@/modules/work-history';
import { withSchemaVersion } from '@/modules/work-history/factCodec';

export interface TimeOutStartedContext {
  factId: string;
  recordedAt: number;
  workSessionId: string;
  focusBlockIndex: number;
  startedAtEpochMs: number;
  focusSecondsBeforeTimeOut: number;
}

export const timeOutStartedFactId = (workSessionId: string, focusBlockIndex: number): string =>
  `time-out-started-${workSessionId}-${focusBlockIndex}`;

export const createTimeOutStartedFact = (context: TimeOutStartedContext): WorkHistoryFact =>
  withSchemaVersion({
    id: context.factId,
    recordedAt: context.recordedAt,
    kind: 'time-out-started',
    payload: {
      workSessionId: context.workSessionId,
      focusBlockIndex: context.focusBlockIndex,
      startedAtEpochMs: context.startedAtEpochMs,
      focusSecondsBeforeTimeOut: context.focusSecondsBeforeTimeOut,
    },
  });
