import { describe, expect, it } from 'vitest';
import type { QuizOption } from '../../types/quiz';
import { restartQuiz, selectOption, setQuizState, updateQuizState } from '../actions/quizActions';
import quizReducer from './quizReducer';

const firstChoice: QuizOption = {
  id: 'Q1_A',
  text: 'First choice',
  mbti: ['F', 'I'],
  friction: ['EMO'],
  next: 'Q2',
};

const resultChoice: QuizOption = {
  id: 'FINAL',
  text: 'Final choice',
  mbti: ['E', 'N', 'T', 'J'],
  friction: ['MOT'],
  next: 'RESULTS',
};

describe('quizReducer', () => {
  it('starts at the first question with no answers', () => {
    expect(quizReducer(undefined, { type: 'test/init' })).toEqual({
      currentQuestionId: 'Q1',
      selectedChoices: [],
      isComplete: false,
      results: null,
    });
  });

  it('sets and partially updates quiz state', () => {
    const loaded = quizReducer(
      undefined,
      setQuizState({
        currentQuestionId: 'Q2',
        selectedChoices: [firstChoice],
        isComplete: false,
        results: null,
      })
    );
    const complete = quizReducer(loaded, updateQuizState({ isComplete: true }));

    expect(loaded.currentQuestionId).toBe('Q2');
    expect(complete.isComplete).toBe(true);
    expect(complete.selectedChoices).toEqual([firstChoice]);
  });

  it('records answers and advances to the next question', () => {
    const state = quizReducer(undefined, selectOption(firstChoice));

    expect(state.selectedChoices).toEqual([firstChoice]);
    expect(state.currentQuestionId).toBe('Q2');
    expect(state.isComplete).toBe(false);
  });

  it('calculates results when the selected option points to RESULTS', () => {
    const answered = quizReducer(undefined, selectOption(firstChoice));
    const complete = quizReducer(answered, selectOption(resultChoice));

    expect(complete.isComplete).toBe(true);
    expect(complete.results).toEqual({
      mbti: 'ENTJ',
      dominantFriction: ['EMO', 'MOT'],
    });
  });

  it('restarts with a fresh initial state', () => {
    const answered = quizReducer(undefined, selectOption(firstChoice));

    expect(quizReducer(answered, restartQuiz())).toEqual(
      quizReducer(undefined, { type: 'test/init' })
    );
  });
});
