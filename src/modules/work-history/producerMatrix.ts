import {
  effectFactsToWorkHistoryFact,
  WORK_HISTORY_FACT_KINDS,
  workHistoryFactToEffectFacts,
} from './factCodec';
import type { WorkHistoryFactKind } from './types';

export type ProducerStatus = 'implemented' | 'missing' | 'excluded';

export interface WorkHistoryProducerEntry {
  lifecycle: string;
  factKind: WorkHistoryFactKind | null;
  status: ProducerStatus;
  producerModule: string | null;
  notes?: string;
}

export const WORK_HISTORY_PRODUCER_MATRIX: readonly WorkHistoryProducerEntry[] = [
  {
    lifecycle: 'Work Session start',
    factKind: 'work-session-started',
    status: 'implemented',
    producerModule: 'work-rhythm/workSessionStarted',
  },
  {
    lifecycle: 'Work Session natural completion',
    factKind: 'work-session-completed',
    status: 'implemented',
    producerModule: 'work-rhythm/workSessionCompleted',
  },
  {
    lifecycle: 'Work Session incomplete end',
    factKind: 'work-session-completed',
    status: 'implemented',
    producerModule: 'work-rhythm/endWorkSessionEarly',
    notes: 'originalGoalPermanentlyComplete=false',
  },
  {
    lifecycle: 'Work Session extension',
    factKind: 'work-session-extended',
    status: 'implemented',
    producerModule: 'work-rhythm/workSessionExtended',
  },
  {
    lifecycle: 'Focus Block completion',
    factKind: 'focus-block-completed',
    status: 'implemented',
    producerModule: 'work-rhythm/focusBlockCompleted',
  },
  {
    lifecycle: 'Focus Block incomplete end',
    factKind: 'focus-block-completed',
    status: 'implemented',
    producerModule: 'work-rhythm/endWorkSessionEarly',
    notes: 'completed=false',
  },
  {
    lifecycle: 'Recess start',
    factKind: 'recess-started',
    status: 'implemented',
    producerModule: 'work-rhythm/recessStarted',
  },
  {
    lifecycle: 'Recess natural completion',
    factKind: 'recess-completed',
    status: 'implemented',
    producerModule: 'work-rhythm/recessCompleted',
    notes: 'endedEarly=false',
  },
  {
    lifecycle: 'Recess early end',
    factKind: 'recess-completed',
    status: 'implemented',
    producerModule: 'work-rhythm/recessCompleted',
    notes: 'endedEarly=true',
  },
  {
    lifecycle: 'Time Out start',
    factKind: 'time-out-started',
    status: 'implemented',
    producerModule: 'work-rhythm/timeOutStarted',
  },
  {
    lifecycle: 'Time Out end',
    factKind: 'time-out-ended',
    status: 'implemented',
    producerModule: 'work-rhythm/timeOutEnded',
  },
  {
    lifecycle: 'Task focused time attribution',
    factKind: 'task-focused-time-attributed',
    status: 'implemented',
    producerModule: 'work-rhythm/taskFocusedTimeAttributed',
  },
  {
    lifecycle: 'Task completion',
    factKind: 'task-completed',
    status: 'implemented',
    producerModule: 'task-list/taskCompleted',
  },
  {
    lifecycle: 'Reminder satisfied',
    factKind: 'reminder-occurrence-resolved',
    status: 'implemented',
    producerModule: 'work-start-reminder/reminderOccurrenceResolved',
    notes: 'outcome=satisfied',
  },
  {
    lifecycle: 'Reminder missed',
    factKind: 'reminder-occurrence-resolved',
    status: 'implemented',
    producerModule: 'work-start-reminder/reminderOccurrenceResolved',
    notes: 'outcome=missed',
  },
  {
    lifecycle: 'Reward Game play',
    factKind: null,
    status: 'excluded',
    producerModule: null,
    notes: 'operational phase only; excluded from Work History catalog',
  },
];

export const implementedProducerEntries = (): WorkHistoryProducerEntry[] =>
  WORK_HISTORY_PRODUCER_MATRIX.filter((entry) => entry.status === 'implemented');

export const coveredFactKinds = (): WorkHistoryFactKind[] => [
  ...new Set(
    WORK_HISTORY_PRODUCER_MATRIX.filter((entry) => entry.factKind !== null).map(
      (entry) => entry.factKind!
    )
  ),
];

export const assertProducerMatrixCoversDeclaredKinds = (): void => {
  const matrixKinds = new Set(coveredFactKinds());
  for (const kind of WORK_HISTORY_FACT_KINDS) {
    if (!matrixKinds.has(kind)) {
      throw new Error(`producer matrix missing declared fact kind: ${kind}`);
    }
  }
};

export { effectFactsToWorkHistoryFact, workHistoryFactToEffectFacts };
