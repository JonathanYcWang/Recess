import { QuizOption, QuizResults, MBTIAxis, FrictionSignal } from '../types/quiz';

/**
 * Calculate MBTI type from user's quiz choices
 */
const calculateMBTI = (choices: QuizOption[]): string => {
  const axes: Record<MBTIAxis, number> = {
    E: 0,
    I: 0,
    N: 0,
    S: 0,
    T: 0,
    F: 0,
    J: 0,
    P: 0,
  };

  // Tally scores from all choices
  choices.forEach((choice) => {
    choice.mbti.forEach((axis) => {
      axes[axis] += 1;
    });
  });

  // Determine each letter by comparing pairs
  let mbti = '';
  mbti += axes.E >= axes.I ? 'E' : 'I';
  mbti += axes.N >= axes.S ? 'N' : 'S';
  mbti += axes.T >= axes.F ? 'T' : 'F';
  mbti += axes.J >= axes.P ? 'J' : 'P';

  return mbti;
};

/**
 * Determine dominant friction signal(s) from user's choices
 */
const calculateDominantFriction = (choices: QuizOption[]): FrictionSignal[] => {
  const counts: Record<string, number> = {};

  // Count friction signals
  choices.forEach((choice) => {
    choice.friction.forEach((signal) => {
      counts[signal] = (counts[signal] || 0) + 1;
    });
  });

  // If no friction signals, return empty array
  if (Object.keys(counts).length === 0) {
    return [];
  }

  // Find maximum count
  const maxCount = Math.max(...Object.values(counts));

  // Return all signals with the maximum count
  return Object.keys(counts).filter((signal) => counts[signal] === maxCount) as FrictionSignal[];
};

/**
 * Calculate final quiz results
 */
export const calculateQuizResults = (choices: QuizOption[]): QuizResults => {
  return {
    mbti: calculateMBTI(choices),
    dominantFriction: calculateDominantFriction(choices),
  };
};
