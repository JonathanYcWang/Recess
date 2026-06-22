import { createReducer } from '@reduxjs/toolkit';
import { restartQuiz, selectOption, setQuizState, updateQuizState } from '../actions/quizActions';
import { calculateQuizResults } from '../../data/quiz-scoring';
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

      if (action.payload.next === 'RESULTS') {
        state.results = calculateQuizResults(state.selectedChoices);
        state.isComplete = true;
        return;
      }

      state.currentQuestionId = action.payload.next;
    })
    .addCase(restartQuiz, () => createInitialQuizState());
});

export default quizReducer;
