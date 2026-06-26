import { createReducer } from '@reduxjs/toolkit';

import { calculateQuizResults } from '../../data/quiz-scoring';
import { restartQuiz, selectOption, setQuizState, updateQuizState } from '../actions/quizActions';
import { createInitialQuizState } from '../initialState';

const initialState = createInitialQuizState();

const quizReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(setQuizState, (_state, action) => action.payload)
    .addCase(updateQuizState, (state, action) => {
      Object.assign(state, action.payload);
    })
    .addCase(selectOption, (state, action) => {
      state.selectedChoices.push(action.payload);
      state.currentQuestionId = action.payload.next;

      if (action.payload.next === 'RESULTS') {
        state.isComplete = true;
        state.results = calculateQuizResults(state.selectedChoices);
      }
    })
    .addCase(restartQuiz, () => createInitialQuizState());
});

export default quizReducer;
