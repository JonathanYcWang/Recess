export interface RandomSource {
  randomUint32(): number;
}

export const createSeededRandomSource = (seed: number): RandomSource => {
  let state = seed >>> 0;
  return {
    randomUint32(): number {
      state = (state * 1_664_525 + 1_013_904_223) >>> 0;
      return state;
    },
  };
};

export const createSequenceRandomSource = (values: readonly number[]): RandomSource => {
  let index = 0;
  return {
    randomUint32(): number {
      const value = values[index] ?? 0;
      index += 1;
      return value >>> 0;
    },
  };
};
