import { createSelector } from '@reduxjs/toolkit';
import type { QuizValue } from '@/Shared/Types/AppState';
import type { RootState } from '../../../Redux/store';

const selectQuizState = (state: RootState): QuizValue => {
  void state;
  // state.appState?.quiz ??
  return {
    currentQuestionId: 'Q1',
    selectedChoices: [],
    isComplete: false,
    results: {
      mbti: 'INTJ',
      dominantFriction: ['distraction', 'starting'],
    },
  };
};

const selectCurrentQuestionId = createSelector([selectQuizState], (quiz) => quiz.currentQuestionId);

export const selectSelectedChoices = createSelector(
  [selectQuizState],
  (quiz) => quiz.selectedChoices
);

export const selectIsQuizComplete = createSelector([selectQuizState], (quiz) => quiz.isComplete);

export const selectQuizResults = createSelector([selectQuizState], (quiz) => quiz.results);

export const selectCurrentQuestion = createSelector([selectCurrentQuestionId], (id) => ({
  id,
  text: '',
  options: [],
}));
