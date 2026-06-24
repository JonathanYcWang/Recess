export const coinsForStandardFocusMinutes = (completedMinutes: number): number =>
  Math.max(0, Math.floor(completedMinutes));

export const coinsForExtensionFocusMinutes = (completedMinutes: number): number =>
  Math.max(0, Math.floor(completedMinutes / 2));
