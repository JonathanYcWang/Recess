import type { WorkHistoryFact } from '@/modules/work-history';
import { withSchemaVersion } from '@/modules/work-history/factCodec';

export interface WorkSessionExtendedContext {
  factId: string;
  recordedAt: number;
  workSessionId: string;
  extensionOrdinal: number;
  extensionSeconds: number;
  extendedAtEpochMs: number;
}

export const workSessionExtendedFactId = (
  workSessionId: string,
  extensionOrdinal: number
): string => `work-session-extended-${workSessionId}-${extensionOrdinal}`;

export const createWorkSessionExtendedFact = (
  context: WorkSessionExtendedContext
): WorkHistoryFact =>
  withSchemaVersion({
    id: context.factId,
    recordedAt: context.recordedAt,
    kind: 'work-session-extended',
    payload: {
      workSessionId: context.workSessionId,
      extensionOrdinal: context.extensionOrdinal,
      extensionSeconds: context.extensionSeconds,
      extendedAtEpochMs: context.extendedAtEpochMs,
    },
  });
