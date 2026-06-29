import { createInMemoryKeyValueAdapter } from '@/adapters/browser/in-memory/inMemoryKeyValueAdapter';
import {
  createPersistedApplicationState,
  type PersistedApplicationState,
  type VersionedDocument,
} from '@/runtime/persistence';
import { createWorkHistoryService } from '@/modules/work-history';
import { createInMemoryWorkHistoryAdapter } from '@/adapters/browser/in-memory/inMemoryWorkHistoryAdapter';
import { DEFAULT_WORK_SESSION_GOAL_SECONDS, type WorkRhythmValue } from '@/modules/work-rhythm';
import { createFixedClock } from '@/runtime/clock';
import { createInMemoryAlarmAdapter } from '@/runtime/alarms/inMemoryAlarmAdapter';
import { createEffectExecutor } from '@/runtime/effects/effectExecutor';
import { createEffectOutcomeStore } from '@/runtime/effects/effectOutcomeStore';
import { createWorkHistoryEffectAdapter } from '@/runtime/effects/workHistoryEffectAdapter';
import { createNoOpTimeOutReportNotifier } from '@/runtime/timeOut/timeOutReportNotifier';
import { createInMemoryWindDownNotificationAdapter } from '@/runtime/windDown/windDownNotificationAdapter';
import { createInMemoryWindDownSoundAdapter } from '@/runtime/windDown/windDownSoundAdapter';
import { createWorkRhythmCommandEnvelope } from '@/runtime/client/inProcessWorkRhythmClient';
import type {
  WorkRhythmCommandHandler,
  WorkRhythmCommandResponse,
} from '@/runtime/workRhythmTypes';
import type { CoinCommandHandler } from '@/runtime/coinTypes';
import { createCoinCommandHandler } from '@/runtime/background/coinCommandHandler';
import { createTaskListCommandHandler } from '@/runtime/background/taskListCommandHandler';
import { createWorkRhythmCommandHandler } from '@/runtime/background/workRhythmCommandHandler';

export interface WorkRhythmVerificationHarness {
  adapter: ReturnType<typeof createInMemoryKeyValueAdapter>;
  persistence: PersistedApplicationState;
  handler: WorkRhythmCommandHandler;
  coinHandler: CoinCommandHandler;
  workHistory: ReturnType<typeof createWorkHistoryService>;
  alarms: ReturnType<typeof createInMemoryAlarmAdapter>;
  windDownNotifications: ReturnType<typeof createInMemoryWindDownNotificationAdapter>;
  setNow(epochMs: number): Promise<void>;
  recreateHandler(): Promise<WorkRhythmCommandHandler>;
  startSession(goalSeconds?: number): Promise<WorkRhythmCommandResponse>;
}

export const createWorkRhythmVerificationHarness = async (options?: {
  nowEpochMs?: number;
  windDownDeliver?: boolean;
  historyAppendFails?: boolean;
  sessionId?: string;
}): Promise<WorkRhythmVerificationHarness> => {
  let nowEpochMs = options?.nowEpochMs ?? 1_000_000;
  const adapter = createInMemoryKeyValueAdapter();
  const persistence = createPersistedApplicationState({ adapter });
  const initialized = await persistence.initialize();
  if (!initialized.ok) {
    throw new Error('expected persistence initialization');
  }

  const profile = initialized.value.documents['workstyle-profile'];
  await persistence.commit([
    {
      document: 'workstyle-profile',
      expectedRevision: profile.revision,
      value: {
        ...profile.value,
        preferredCadence: '25/5',
      },
    },
  ]);

  const workHistory = createWorkHistoryService(createInMemoryWorkHistoryAdapter());
  const windDownNotifications = createInMemoryWindDownNotificationAdapter({
    deliver: options?.windDownDeliver ?? true,
  });
  const windDownSounds = createInMemoryWindDownSoundAdapter();
  const effectExecutor = createEffectExecutor({
    store: createEffectOutcomeStore(adapter),
    adapters: [
      createWorkHistoryEffectAdapter({
        append: async (facts) => {
          if (options?.historyAppendFails) {
            return { ok: false, error: 'append-failed' };
          }
          const result = await workHistory.append(facts);
          return result.ok ? { ok: true } : { ok: false, error: 'append-failed' };
        },
      }),
      windDownNotifications,
      windDownSounds,
    ],
  });

  const refreshed = await persistence.initialize();
  if (!refreshed.ok) {
    throw new Error('expected persistence refresh');
  }

  const coinHandler = createCoinCommandHandler(persistence, refreshed.value.documents.coin);
  const taskListHandler = createTaskListCommandHandler(
    persistence,
    refreshed.value.documents['task-list'],
    {
      clock: createFixedClock(nowEpochMs),
    }
  );
  const alarms = createInMemoryAlarmAdapter();
  const sessionId = options?.sessionId ?? 'ws-verify';

  const loadWorkRhythmDocument = async (): Promise<VersionedDocument<WorkRhythmValue>> => {
    const latest = await persistence.initialize();
    if (!latest.ok) {
      throw new Error('expected persistence reload');
    }
    return latest.value.documents['work-rhythm'];
  };

  const buildHandler = (document: VersionedDocument<WorkRhythmValue>) =>
    createWorkRhythmCommandHandler(persistence, document, {
      clock: createFixedClock(nowEpochMs),
      alarms,
      coinHandler,
      taskListHandler,
      effectExecutor,
      timeOutReportNotifier: createNoOpTimeOutReportNotifier(),
      createSessionId: () => sessionId,
    });

  let handler = buildHandler(await loadWorkRhythmDocument());

  const syncHandler = async (): Promise<WorkRhythmCommandHandler> => {
    handler = buildHandler(await loadWorkRhythmDocument());
    return handler;
  };

  const harness: WorkRhythmVerificationHarness = {
    adapter,
    persistence,
    get handler() {
      return handler;
    },
    coinHandler,
    workHistory,
    alarms,
    windDownNotifications,
    async setNow(epochMs: number) {
      nowEpochMs = epochMs;
      await syncHandler();
    },
    recreateHandler: syncHandler,
    async startSession(goalSeconds = DEFAULT_WORK_SESSION_GOAL_SECONDS) {
      const response = await handler.execute(
        createWorkRhythmCommandEnvelope({
          kind: 'start-work-session',
          goalSeconds,
          energy: 'steady',
        })
      );
      if (response.ok) {
        await syncHandler();
      }
      return response;
    },
  };

  return harness;
};
