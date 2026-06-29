import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import QuizQuestion from '@/UI/Components/QuizQuestion/QuizQuestion';
import Button from '@/UI/Components/Button/Button';
import { QuizOption } from '../../../Shared/Types/Quiz';
import { sendAppAction } from '../../../Shared/ActionBrokers/ActionBroker';
import type { RootState } from '../../Redux/store';
import {
  selectCurrentQuestion,
  selectIsQuizComplete,
  selectQuizResults,
  selectSelectedChoices,
} from '../../Redux/Selectors/index';
import styles from './QuizPage.module.css';

const QuizPage = () => {
  const currentQuestion = useSelector((state: RootState) => selectCurrentQuestion(state));
  const selectedChoices = useSelector((state: RootState) => selectSelectedChoices(state));
  const isComplete = useSelector((state: RootState) => selectIsQuizComplete(state));
  const results = useSelector((state: RootState) => selectQuizResults(state));
  const navigate = useNavigate();

  const handleSelectOption = (option: QuizOption) => {
    void sendAppAction({ type: 'QUIZ_SELECT_OPTION', option });
  };

  const handleRestart = () => {
    void sendAppAction({ type: 'QUIZ_RESTART' });
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
            <Button text="Take Quiz Again" onClick={handleRestart} variant="primary" />
            <Button text="Back to Home" onClick={handleBackToHome} variant="primary" />
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Question not found</div>
        <Button text="Restart Quiz" onClick={handleRestart} variant="primary" />
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
