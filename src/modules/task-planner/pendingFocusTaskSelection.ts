let pendingTaskIds: string[] = [];

export const setPendingFocusTaskIds = (taskIds: string[]): void => {
  pendingTaskIds = [...taskIds];
};

export const consumePendingFocusTaskIds = (): string[] => {
  const ids = pendingTaskIds;
  pendingTaskIds = [];
  return ids;
};

export const resetPendingFocusTaskIdsForTests = (): void => {
  pendingTaskIds = [];
};
