export interface Clock {
  nowEpochMs(): number;
}

export const createSystemClock = (): Clock => ({
  nowEpochMs: () => Date.now(),
});

export const createFixedClock = (nowEpochMs: number): Clock => ({
  nowEpochMs: () => nowEpochMs,
});
