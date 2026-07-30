import { z } from 'zod';
import {
  DEFAULT_BLOCK_LIST_ENTRIES,
  DEFAULT_REROLLS,
  SCHEDULER_PHASE,
  WORK_SESSION_DURATION,
} from '@/Shared/Constants/Constants';
import type { PersistedAppState } from '@/Shared/Types/AppState';

const recessOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  duration: z.number().nonnegative(),
});

const recessPickerSchema = z.object({
  rerolls: z.number().nonnegative(),
  selectedRecess: recessOptionSchema.nullable(),
  recessOptions: z.array(recessOptionSchema),
});

const persistedAppStateSchema = z.object({
  blockList: z.object({
    entries: z.array(z.string()),
  }),
  scheduler: z.object({
    activePhase: z.enum(SCHEDULER_PHASE).nullable(),
    phaseStart: z.string().nullable(),
    phaseTarget: z.number().nonnegative(),
    workSessionTarget: z.number().nonnegative(),
    workSessionRemaining: z.number().nonnegative(),
  }),
  recessPicker: recessPickerSchema,
});

export const createDefaultPersistedAppState = (): PersistedAppState => ({
  blockList: { entries: [...DEFAULT_BLOCK_LIST_ENTRIES] },
  scheduler: {
    activePhase: null,
    phaseStart: null,
    phaseTarget: 0,
    workSessionTarget: WORK_SESSION_DURATION,
    workSessionRemaining: WORK_SESSION_DURATION,
  },
  recessPicker: {
    rerolls: DEFAULT_REROLLS,
    selectedRecess: null,
    recessOptions: [],
  },
});

export const parsePersistedAppState = (value: unknown): PersistedAppState => {
  const result = persistedAppStateSchema.safeParse(value);
  return result.success ? result.data : createDefaultPersistedAppState();
};
