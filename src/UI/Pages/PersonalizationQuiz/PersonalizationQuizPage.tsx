import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/UI/Components/Button/Button';
import styles from './PersonalizationQuizPage.module.css';

const PersonalizationQuizPage = () => {
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoaded(true);
    })();
  }, [navigate]);

  const handleDismiss = async () => {
    navigate('/');
  };

  const handleRestart = async () => {
    setSubmitting(true);
    setError(null);
    setSubmitting(false);
  };

  // const handleSelectOption = async (scenarioId: string, optionId: string) => {
  //   setSubmitting(true);
  //   setError(null);
  //   setSubmitting(false);
  // };

  if (!loaded) {
    return <div className={styles.container}>Loading your quiz progress…</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Personalization Quiz</h1>
        <p>
          Optional questions that refine how Recess understands your friction patterns. You can
          dismiss, resume later, or restart anytime.
        </p>
      </header>

      <section className={styles.section} aria-live="polite">
        <p className={styles.meta}>Question 1 of up to 12</p>
        <h2>How do you feel about starting work today?</h2>
        <div className={styles.optionList} role="list">
          <button
            type="button"
            className={styles.option}
            disabled={submitting}
            // onClick={() => handleSelectOption('q1', 'ready')}
          >
            Ready to focus
          </button>
          <button
            type="button"
            className={styles.option}
            disabled={submitting}
            // onClick={() => handleSelectOption('q1', 'hesitant')}
          >
            Hesitant
          </button>
          <button
            type="button"
            className={styles.option}
            disabled={submitting}
            // onClick={() => handleSelectOption('q1', 'overwhelmed')}
          >
            Overwhelmed
          </button>
        </div>
      </section>

      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.actions}>
        <Button text="Dismiss for now" onClick={() => void handleDismiss()} variant="primary" />
        <Button
          text={submitting ? 'Working…' : 'Restart quiz'}
          onClick={() => void handleRestart()}
          variant="primary"
        />
      </div>
    </div>
  );
};

export default PersonalizationQuizPage;
