import {
  createDiagnosticRingBuffer,
  createPersistedApplicationState,
  type KeyValueStorageAdapter,
} from '@/modules/persisted-application-state';
import { createInProcessSettingsClient } from '../client/inProcessSettingsClient';
import { createInProcessBlockListClient } from '../client/inProcessBlockListClient';
import { createInProcessWorkstyleProfileClient } from '../client/inProcessWorkstyleProfileClient';
import { createInProcessCoinClient } from '../client/inProcessCoinClient';
import { createInProcessWorkRhythmClient } from '../client/inProcessWorkRhythmClient';
import { createInProcessHallPassClient } from '../client/inProcessHallPassClient';
import { createInProcessWorkStartReminderClient } from '../client/inProcessWorkStartReminderClient';
import { createInProcessTaskListClient } from '../client/inProcessTaskListClient';
import { createCommandOutcomeStore } from '../commandOutcomeStore';
import type {
  BlockListClient,
  BlockListCommandHandler,
  BlockListCommandResponse,
} from '../blockListTypes';
import type {
  SettingsClient,
  SettingsCommandHandler,
  SettingsCommandResponse,
  SettingsRuntimeError,
} from '../types';
import type {
  WorkstyleProfileClient,
  WorkstyleProfileCommandHandler,
  WorkstyleProfileCommandResponse,
} from '../workstyleProfileTypes';
import type { CoinClient, CoinCommandHandler, CoinCommandResponse } from '../coinTypes';
import type {
  WorkRhythmClient,
  WorkRhythmCommandHandler,
  WorkRhythmCommandResponse,
} from '../workRhythmTypes';
import type {
  HallPassClient,
  HallPassCommandHandler,
  HallPassCommandResponse,
} from '../hallPassTypes';
import type {
  WorkStartReminderClient,
  WorkStartReminderCommandHandler,
  WorkStartReminderCommandResponse,
} from '../workStartReminderTypes';
import type {
  TaskListClient,
  TaskListCommandHandler,
  TaskListCommandResponse,
} from '../taskListTypes';
import { createBlockListCommandHandler } from './blockListCommandHandler';
import { createSettingsCommandHandler } from './settingsCommandHandler';
import { createWorkstyleProfileCommandHandler } from './workstyleProfileCommandHandler';
import { createCoinCommandHandler } from './coinCommandHandler';
import { createWorkRhythmCommandHandler } from './workRhythmCommandHandler';
import { createHallPassCommandHandler } from './hallPassCommandHandler';
import { createWorkStartReminderCommandHandler } from './workStartReminderCommandHandler';
import { createTaskListCommandHandler } from './taskListCommandHandler';
import { createSystemClock } from '../clock';
import { createInMemoryAlarmAdapter } from '../alarms/inMemoryAlarmAdapter';
import { createSafariCompatibleAlarmAdapter } from '../alarms/chromiumAlarmAdapter';
import {
  createInMemoryBrowserActivityAdapter,
  createInMemoryBrowserActivityState,
} from '@/modules/browser-activity/inMemoryBrowserActivity';
import { createSafariCompatibleBrowserActivityAdapter } from '@/adapters/browser/safari/safariBrowserActivityAdapter';
import { createInMemoryWorkHistoryAdapter } from '@/adapters/browser/in-memory/inMemoryWorkHistoryAdapter';
import { createWorkHistoryService } from '@/modules/work-history';
import { createEffectExecutor } from '../effects/effectExecutor';
import { createEffectOutcomeStore } from '../effects/effectOutcomeStore';
import { createWorkHistoryEffectAdapter } from '../effects/workHistoryEffectAdapter';
import { createChromiumWindDownNotificationAdapter } from '../windDown/windDownNotificationAdapter';
import { createChromiumWindDownSoundAdapter } from '../windDown/windDownSoundAdapter';
import { createSafariCompatibleReminderNotificationAdapter } from '../notifications/reminderNotificationAdapter';
import type { AlarmAdapter } from '../alarms/types';
import { createSessionNotificationTimeOutReportNotifier } from '../timeOut/timeOutReportNotifier';

export interface BackgroundCompositionRoot {
  settings: SettingsClient;
  blockList: BlockListClient;
  workstyleProfile: WorkstyleProfileClient;
  coin: CoinClient;
  workRhythm: WorkRhythmClient;
  hallPass: HallPassClient;
  workStartReminder: WorkStartReminderClient;
  taskList: TaskListClient;
  settingsHandler: SettingsCommandHandler;
  blockListHandler: BlockListCommandHandler;
  workstyleProfileHandler: WorkstyleProfileCommandHandler;
  coinHandler: CoinCommandHandler;
  workRhythmHandler: WorkRhythmCommandHandler;
  hallPassHandler: HallPassCommandHandler;
  workStartReminderHandler: WorkStartReminderCommandHandler;
  taskListHandler: TaskListCommandHandler;
}

type BackgroundCompositionRootResult =
  | { ok: true; value: BackgroundCompositionRoot }
  | { ok: false; error: SettingsRuntimeError };

export const createBackgroundCompositionRoot = async (options: {
  adapter: KeyValueStorageAdapter;
}): Promise<BackgroundCompositionRootResult> => {
  const diagnostics = createDiagnosticRingBuffer();
  const persistence = createPersistedApplicationState({ adapter: options.adapter, diagnostics });
  const initialized = await persistence.initialize();
  if (!initialized.ok) {
    return { ok: false, error: { kind: 'persistence-unavailable' } };
  }

  const settingsOutcomeStore = createCommandOutcomeStore<SettingsCommandResponse>(options.adapter);
  const blockListOutcomeStore = createCommandOutcomeStore<BlockListCommandResponse>(
    options.adapter
  );
  const workstyleProfileOutcomeStore = createCommandOutcomeStore<WorkstyleProfileCommandResponse>(
    options.adapter
  );
  const coinOutcomeStore = createCommandOutcomeStore<CoinCommandResponse>(options.adapter);
  const workRhythmOutcomeStore = createCommandOutcomeStore<WorkRhythmCommandResponse>(
    options.adapter
  );
  const hallPassOutcomeStore = createCommandOutcomeStore<HallPassCommandResponse>(options.adapter);
  const workStartReminderOutcomeStore = createCommandOutcomeStore<WorkStartReminderCommandResponse>(
    options.adapter
  );
  const taskListOutcomeStore = createCommandOutcomeStore<TaskListCommandResponse>(options.adapter);
  const settingsHandler = createSettingsCommandHandler(
    persistence,
    initialized.value.documents.settings,
    { diagnostics, outcomeStore: settingsOutcomeStore }
  );
  const blockListHandler = createBlockListCommandHandler(
    persistence,
    initialized.value.documents['block-list'],
    { adapter: options.adapter, diagnostics, outcomeStore: blockListOutcomeStore }
  );
  const workstyleProfileHandler = createWorkstyleProfileCommandHandler(
    persistence,
    initialized.value.documents['workstyle-profile'],
    { diagnostics, outcomeStore: workstyleProfileOutcomeStore }
  );
  const coinHandler = createCoinCommandHandler(persistence, initialized.value.documents.coin, {
    diagnostics,
    outcomeStore: coinOutcomeStore,
  });

  const workHistory = createWorkHistoryService(createInMemoryWorkHistoryAdapter());
  const effectExecutor = createEffectExecutor({
    store: createEffectOutcomeStore(options.adapter),
    adapters: [
      createWorkHistoryEffectAdapter({
        append: async (facts) => {
          const result = await workHistory.append(facts);
          return result.ok ? { ok: true } : { ok: false, error: 'append-failed' };
        },
      }),
      createChromiumWindDownNotificationAdapter(),
      createChromiumWindDownSoundAdapter(),
    ],
  });

  const alarms: AlarmAdapter = createSafariCompatibleAlarmAdapter() ?? createInMemoryAlarmAdapter();
  const clock = createSystemClock();
  const browserActivity =
    createSafariCompatibleBrowserActivityAdapter() ??
    createInMemoryBrowserActivityAdapter(createInMemoryBrowserActivityState());

  const workStartReminderHandler = createWorkStartReminderCommandHandler(
    persistence,
    initialized.value.documents['work-start-reminder'],
    {
      clock,
      alarms,
      notifications: createSafariCompatibleReminderNotificationAdapter(),
      coinHandler,
      streakInitialized: initialized.value.documents['work-session-streak'],
      adapter: options.adapter,
      diagnostics,
      outcomeStore: workStartReminderOutcomeStore,
    }
  );

  const taskListHandler = createTaskListCommandHandler(
    persistence,
    initialized.value.documents['task-list'],
    {
      clock,
      diagnostics,
      outcomeStore: taskListOutcomeStore,
    }
  );

  const workRhythmHandler = createWorkRhythmCommandHandler(
    persistence,
    initialized.value.documents['work-rhythm'],
    {
      clock,
      alarms,
      coinHandler,
      taskListHandler,
      effectExecutor,
      diagnostics,
      outcomeStore: workRhythmOutcomeStore,
      timeOutReportNotifier: createSessionNotificationTimeOutReportNotifier(),
      onWorkSessionStarted: async (input) => {
        await workStartReminderHandler.applyWorkSessionStarted(input);
      },
    }
  );
  await workRhythmHandler.reconcileDueBoundaries();
  await workRhythmHandler.reconcileTimeOutReports();
  await workRhythmHandler.reconcileWindDownSignals();

  const hallPassHandler = createHallPassCommandHandler(
    persistence,
    initialized.value.documents['hall-pass'],
    {
      clock,
      coinHandler,
      browserActivity,
      diagnostics,
      outcomeStore: hallPassOutcomeStore,
      phaseContext: () => {
        const current = workRhythmHandler.current();
        const blockList = blockListHandler.current();
        const isTimeOut = current.ok && current.value.snapshot.phase === 'time-out';
        const blockListEntries = blockList.ok ? blockList.value.value.entries : [];
        return { isTimeOut, blockListEntries };
      },
    }
  );

  await workStartReminderHandler.bootstrapPlanning();
  const workHistoryFacts = await workHistory.query();
  if (workHistoryFacts.ok) {
    for (const fact of workHistoryFacts.value) {
      if (fact.kind !== 'work-session-started') {
        continue;
      }
      const workSessionId = fact.payload.workSessionId;
      const startedAtEpochMs = fact.payload.startedAtEpochMs;
      if (typeof workSessionId !== 'string' || typeof startedAtEpochMs !== 'number') {
        continue;
      }
      await workStartReminderHandler.applyWorkSessionStarted({
        workSessionId,
        startedAtEpochMs,
      });
    }
  }

  return {
    ok: true,
    value: {
      settings: createInProcessSettingsClient(settingsHandler),
      blockList: createInProcessBlockListClient(blockListHandler),
      workstyleProfile: createInProcessWorkstyleProfileClient(workstyleProfileHandler),
      coin: createInProcessCoinClient(coinHandler),
      workRhythm: createInProcessWorkRhythmClient(workRhythmHandler),
      hallPass: createInProcessHallPassClient(hallPassHandler),
      workStartReminder: createInProcessWorkStartReminderClient(workStartReminderHandler),
      taskList: createInProcessTaskListClient(taskListHandler),
      settingsHandler,
      blockListHandler,
      workstyleProfileHandler,
      coinHandler,
      workRhythmHandler,
      hallPassHandler,
      workStartReminderHandler,
      taskListHandler,
    },
  };
};
