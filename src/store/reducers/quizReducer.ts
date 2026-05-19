import { createReducer } from '@reduxjs/toolkit';
import type { QuizReduxState } from '../actions/quizActions';
import { restartQuiz, selectOption, setQuizState, updateQuizState } from '../actions/quizActions';
import { calculateQuizResults } from '../../data/quiz-scoring';

const createInitialState = (): QuizReduxState => ({
  currentQuestionId: 'Q1',
  selectedChoices: [],
  isComplete: false,
  results: null,
});

const initialState = createInitialState();

const quizReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(setQuizState, (_state, action) => action.payload)
    .addCase(updateQuizState, (state, action) => {
      Object.assign(state, action.payload);
    })
    .addCase(selectOption, (state, action) => {
      state.selectedChoices.push(action.payload);

      if (action.payload.next === 'RESULTS') {
        state.results = calculateQuizResults(state.selectedChoices);
        state.isComplete = true;
        return;
      }

      state.currentQuestionId = action.payload.next;
    })
    .addCase(restartQuiz, () => createInitialState());
});

export default quizReducer;
