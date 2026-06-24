export const WORK_SESSION_EXTENSION_MIN_SECONDS = 15 * 60;
export const WORK_SESSION_EXTENSION_MAX_SECONDS = 120 * 60;
export const WORK_SESSION_EXTENSION_STEP_SECONDS = 15 * 60;
export const WORK_SESSION_EXTENSION_CUMULATIVE_MAX_SECONDS = 8 * 60 * 60;

export const isValidWorkSessionExtensionSeconds = (seconds: number): boolean =>
  Number.isInteger(seconds) &&
  seconds >= WORK_SESSION_EXTENSION_MIN_SECONDS &&
  seconds <= WORK_SESSION_EXTENSION_MAX_SECONDS &&
  (seconds - WORK_SESSION_EXTENSION_MIN_SECONDS) % WORK_SESSION_EXTENSION_STEP_SECONDS === 0;

export const remainingWorkSessionExtensionSeconds = (cumulativeExtensionSeconds: number): number =>
  WORK_SESSION_EXTENSION_CUMULATIVE_MAX_SECONDS - cumulativeExtensionSeconds;
