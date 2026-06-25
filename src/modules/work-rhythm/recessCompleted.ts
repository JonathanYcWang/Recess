import type { WorkHistoryFact } from '@/modules/work-history';
import { withSchemaVersion } from '@/modules/work-history/factCodec';

export interface RecessCompletedContext {
  factId: string;
  recordedAt: number;
  workSessionId: string;
  focusBlockIndex: number;
  startedAtEpochMs: number;
  endedAtEpochMs: number;
  actualRecessSeconds: number;
  endedEarly: boolean;
}

export const recessCompletedFactId = (
  workSessionId: string,
  focusBlockIndex: number,
  endedEarly: boolean
): string =>
  `recess-completed-${workSessionId}-${focusBlockIndex}-${endedEarly ? 'early' : 'natural'}`;

export const createRecessCompletedFact = (context: RecessCompletedContext): WorkHistoryFact =>
  withSchemaVersion({
    id: context.factId,
    recordedAt: context.recordedAt,
    kind: 'recess-completed',
    payload: {
      workSessionId: context.workSessionId,
      focusBlockIndex: context.focusBlockIndex,
      startedAtEpochMs: context.startedAtEpochMs,
      endedAtEpochMs: context.endedAtEpochMs,
      actualRecessSeconds: context.actualRecessSeconds,
      endedEarly: context.endedEarly,
    },
  });
