import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../../Redux/store';

interface QuizResults {
  mbti: string;
  dominantFriction: string[];
}

const selectQuizState = (state: RootState) =>
  state.appState?.quiz ?? {
    currentQuestionId: 'Q1',
    selectedChoices: [],
    isComplete: false,
    results: {
      mbti: 'INTJ',
      dominantFriction: ['distraction', 'starting'],
    } as QuizResults,
  };

const selectCurrentQuestionId = createSelector([selectQuizState], (quiz) => quiz.currentQuestionId);

export const selectSelectedChoices = createSelector(
  [selectQuizState],
  (quiz) => quiz.selectedChoices
);

export const selectIsQuizComplete = createSelector([selectQuizState], (quiz) => quiz.isComplete);

export const selectQuizResults = createSelector(
  [selectQuizState],
  (quiz) => quiz.results as QuizResults
);

export const selectCurrentQuestion = createSelector([selectCurrentQuestionId], (id) => ({
  id,
  text: '',
  options: [],
}));
