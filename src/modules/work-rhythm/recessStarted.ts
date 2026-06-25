import type { WorkHistoryFact } from '@/modules/work-history';
import { withSchemaVersion } from '@/modules/work-history/factCodec';

export interface RecessStartedContext {
  factId: string;
  recordedAt: number;
  workSessionId: string;
  focusBlockIndex: number;
  startedAtEpochMs: number;
  plannedRecessSeconds: number;
}

export const recessStartedFactId = (workSessionId: string, focusBlockIndex: number): string =>
  `recess-started-${workSessionId}-${focusBlockIndex}`;

export const createRecessStartedFact = (context: RecessStartedContext): WorkHistoryFact =>
  withSchemaVersion({
    id: context.factId,
    recordedAt: context.recordedAt,
    kind: 'recess-started',
    payload: {
      workSessionId: context.workSessionId,
      focusBlockIndex: context.focusBlockIndex,
      startedAtEpochMs: context.startedAtEpochMs,
      plannedRecessSeconds: context.plannedRecessSeconds,
    },
  });
