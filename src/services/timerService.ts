// Shared utility functions for timer/session state

/**
 * Format time in seconds to MM:SS format
 * @param seconds - Time in seconds (will be floored to whole number)
 */
export const formatTime = (seconds: number): string => {
  const wholeSeconds = Math.floor(seconds);
  const mins = Math.floor(wholeSeconds / 60);
  const secs = wholeSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Format work session time in seconds to "X Hrs Y Min" format
 * @param seconds - Time in seconds (will be floored to whole number)
 */
export const formatWorkSessionTime = (seconds: number): string => {
  const wholeSeconds = Math.floor(seconds);
  const hours = Math.floor(wholeSeconds / 3600);
  const minutes = Math.floor((wholeSeconds % 3600) / 60);

  if (hours === 0) {
    return `${minutes} Min`;
  } else if (minutes === 0) {
    return `${hours} Hrs`;
  } else {
    return `${hours} Hrs ${minutes} Min`;
  }
};

/**
 * Calculate remaining time based on entry timestamp
 * Used by timer to compute live countdown values
 */
export const calculateRemaining = (initialDuration: number, entryTimeStamp?: number): number => {
  if (!entryTimeStamp) return initialDuration;
  const currentTime = Date.now();
  const elapsed = Math.floor((currentTime - entryTimeStamp) / 1000);
  return Math.max(0, initialDuration - elapsed);
};
