import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import { getQuestionById } from '../../data/quiz-data';

const selectQuizState = (state: RootState) => state.quiz;

const selectCurrentQuestionId = createSelector([
  selectQuizState,
], (quiz) => quiz.currentQuestionId);

export const selectSelectedChoices = createSelector(
  [selectQuizState],
  (quiz) => quiz.selectedChoices
);

export const selectIsQuizComplete = createSelector([selectQuizState], (quiz) => quiz.isComplete);

export const selectQuizResults = createSelector([selectQuizState], (quiz) => quiz.results);

export const selectCurrentQuestion = createSelector(
  [selectCurrentQuestionId],
  (id) => getQuestionById(id)
);
