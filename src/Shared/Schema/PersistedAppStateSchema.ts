import { z } from 'zod';
import { SCHEDULER_PHASE } from '@/Shared/Constants/Constants';
import { createDefaultPersistedAppState } from '@/Shared/State/defaults';
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

export const parsePersistedAppState = (value: unknown): PersistedAppState => {
  const result = persistedAppStateSchema.safeParse(value);
  if (!result.success) {
    return createDefaultPersistedAppState();
  }

  return result.data;
};
