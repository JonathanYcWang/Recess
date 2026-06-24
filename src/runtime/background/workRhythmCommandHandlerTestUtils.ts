import type {
  PersistedApplicationState,
  VersionedDocument,
} from '@/modules/persisted-application-state';
import type { WorkRhythmValue } from '@/modules/work-rhythm';
import type { Clock } from '../clock';
import type { AlarmAdapter } from '../alarms/types';
import type { CoinCommandHandler } from '../coinTypes';
import type { EffectExecutor } from '../effects/effectExecutor';
import type { TimeOutReportNotifier } from '../timeOut/timeOutReportNotifier';
import { createCoinCommandHandler } from './coinCommandHandler';
import { createTaskListCommandHandler } from './taskListCommandHandler';
import { createWorkRhythmCommandHandler } from './workRhythmCommandHandler';

export const createWorkRhythmHandlerForTests = async (
  persistence: PersistedApplicationState,
  workRhythmDoc: VersionedDocument<WorkRhythmValue>,
  options: {
    clock: Clock;
    alarms: AlarmAdapter;
    coinHandler?: CoinCommandHandler;
    effectExecutor?: EffectExecutor;
    timeOutReportNotifier?: TimeOutReportNotifier;
    createSessionId?: () => string;
    onWorkSessionStarted?: (input: {
      workSessionId: string;
      startedAtEpochMs: number;
    }) => Promise<void>;
  }
) => {
  const hydrated = await persistence.initialize();
  if (!hydrated.ok) {
    throw new Error('expected persistence hydration');
  }
  const coinHandler =
    options.coinHandler ?? createCoinCommandHandler(persistence, hydrated.value.documents.coin);
  const taskListHandler = createTaskListCommandHandler(
    persistence,
    hydrated.value.documents['task-list'],
    { clock: options.clock }
  );
  return createWorkRhythmCommandHandler(persistence, workRhythmDoc, {
    ...options,
    coinHandler,
    taskListHandler,
  });
};
