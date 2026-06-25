import type { WorkHistoryFact } from '@/modules/work-history';
import { withSchemaVersion } from '@/modules/work-history/factCodec';

export interface WorkSessionStartedContext {
  factId: string;
  recordedAt: number;
  workSessionId: string;
  startedAtEpochMs: number;
  goalSeconds: number;
  energy: string;
}

export const workSessionStartedFactId = (sessionId: string): string =>
  `work-session-started-${sessionId}`;

export const createWorkSessionStartedFact = (context: WorkSessionStartedContext): WorkHistoryFact =>
  withSchemaVersion({
    id: context.factId,
    recordedAt: context.recordedAt,
    kind: 'work-session-started',
    payload: {
      workSessionId: context.workSessionId,
      startedAtEpochMs: context.startedAtEpochMs,
      goalSeconds: context.goalSeconds,
      energy: context.energy,
    },
  });
