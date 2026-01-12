import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QuizQuestion from '../components/QuizQuestion';
import PrimaryButton from '../components/PrimaryButton';
import { getQuestionById } from '../lib/quiz-data';
import { calculateQuizResults } from '../lib/quiz-scoring';
import { QuizOption } from '../types/quiz';
import styles from './QuizPage.module.css';

const QuizPage: React.FC = () => {
  const [currentQuestionId, setCurrentQuestionId] = useState('Q1');
  const [selectedChoices, setSelectedChoices] = useState<QuizOption[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [results, setResults] = useState<{ mbti: string; dominantFriction: string[] } | null>(null);
  const navigate = useNavigate();

  const currentQuestion = getQuestionById(currentQuestionId);

  const handleSelectOption = (option: QuizOption) => {
    const newChoices = [...selectedChoices, option];
    setSelectedChoices(newChoices);

    // Check if this is the end of the quiz
    if (option.next === 'RESULTS') {
      const quizResults = calculateQuizResults(newChoices);
      setResults(quizResults);
      setIsComplete(true);
    } else {
      // Move to next question
      setCurrentQuestionId(option.next);
    }
  };

  const handleRestart = () => {
    setCurrentQuestionId('Q1');
    setSelectedChoices([]);
    setIsComplete(false);
    setResults(null);
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  if (isComplete && results) {
    return (
      <div className={styles.container}>
        <div className={styles.resultsContainer}>
          <h1 className={styles.resultsTitle}>Quiz Complete!</h1>
          <div className={styles.resultsContent}>
            <div className={styles.resultSection}>
              <h2 className={styles.resultLabel}>Your MBTI Work Type:</h2>
              <div className={styles.resultValue}>{results.mbti}</div>
            </div>
            <div className={styles.resultSection}>
              <h2 className={styles.resultLabel}>Dominant Work Friction Signal(s):</h2>
              <div className={styles.resultValue}>
                {results.dominantFriction.length > 0 ? results.dominantFriction.join(', ') : 'None'}
              </div>
            </div>
          </div>
          <div className={styles.buttonGroup}>
            <PrimaryButton text="Take Quiz Again" onClick={handleRestart} />
            <PrimaryButton text="Back to Home" onClick={handleBackToHome} />
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Question not found</div>
        <PrimaryButton text="Restart Quiz" onClick={handleRestart} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.progressText}>Question {selectedChoices.length + 1}</div>
      </div>
      <QuizQuestion question={currentQuestion} onSelectOption={handleSelectOption} />
    </div>
  );
};

export default QuizPage;
