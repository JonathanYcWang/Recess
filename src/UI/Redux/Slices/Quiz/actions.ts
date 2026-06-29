import { createAction } from '@reduxjs/toolkit';
import type { QuizOption, QuizResults } from '@/Shared/Types/Quiz';

export interface QuizReduxState {
  currentQuestionId: string;
  selectedChoices: QuizOption[];
  isComplete: boolean;
  results: QuizResults | null;
}

export const setQuizState = createAction<QuizReduxState>('quiz/setQuizState');
export const updateQuizState = createAction<Partial<QuizReduxState>>('quiz/updateQuizState');
export const selectOption = createAction<QuizOption>('quiz/selectOption');
export const restartQuiz = createAction('quiz/restartQuiz');
