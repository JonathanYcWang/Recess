import { z } from 'zod';
import {
  DEFAULT_BLOCK_LIST_ENTRIES,
  DEFAULT_REROLLS,
  SCHEDULER_PHASE,
  WORK_SESSION_DURATION,
} from '@/Shared/Constants/Constants';
import { applyBlockListEnforcement } from '@/Shared/Utils/blockListEnforcement';
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

const blockListEntrySchema = z.object({
  url: z.string(),
  isBlocked: z.boolean(),
});

const blockListSchema = z.preprocess((value) => {
  if (
    value !== null &&
    typeof value === 'object' &&
    'entries' in value &&
    Array.isArray(value.entries)
  ) {
    return value.entries.map((entry) =>
      typeof entry === 'string' ? { url: entry, isBlocked: false } : entry
    );
  }

  return value;
}, z.array(blockListEntrySchema));

const persistedAppStateSchema = z.object({
  blockList: blockListSchema,
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
  blockList: DEFAULT_BLOCK_LIST_ENTRIES.map((url) => ({ url, isBlocked: false })),
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
  if (!result.success) {
    return createDefaultPersistedAppState();
  }

  return applyBlockListEnforcement(result.data);
};
