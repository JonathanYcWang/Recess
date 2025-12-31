// Shared utility functions for timer/session state

/**
 * Format time in seconds to MM:SS format
 */
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Format work session time in seconds to "X Hrs Y Min" format
 */
export const formatWorkSessionTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours === 0) {
    return `${minutes} Min`;
  } else if (minutes === 0) {
    return `${hours} Hrs`;
  } else {
    return `${hours} Hrs ${minutes} Min`;
  }
};
