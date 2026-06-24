export interface WorkSessionStreakValue {
  count: number;
  processedLogicalOutcomeIds: string[];
}

export const createDefaultWorkSessionStreakValue = (): WorkSessionStreakValue => ({
  count: 0,
  processedLogicalOutcomeIds: [],
});

export const cloneWorkSessionStreakValue = (
  value: WorkSessionStreakValue
): WorkSessionStreakValue => ({
  count: value.count,
  processedLogicalOutcomeIds: [...value.processedLogicalOutcomeIds],
});
