const FIRST_HOUR_OPTIONS = [15, 30, 45, 60] as const;

const afterFirstHourOptions = (): number[] => {
  const options: number[] = [];
  for (let minutes = 90; minutes <= 480; minutes += 30) {
    options.push(minutes);
  }
  return options;
};

export const TIME_ESTIMATE_OPTIONS_MINUTES: readonly number[] = [
  ...FIRST_HOUR_OPTIONS,
  ...afterFirstHourOptions(),
];

export const isValidTimeEstimateMinutes = (minutes: number): boolean =>
  TIME_ESTIMATE_OPTIONS_MINUTES.includes(minutes);

export const deriveRemainingWorkSeconds = (task: {
  originalEstimateMinutes: number;
  focusedTimeSeconds: number;
}): number => Math.max(0, task.originalEstimateMinutes * 60 - task.focusedTimeSeconds);
