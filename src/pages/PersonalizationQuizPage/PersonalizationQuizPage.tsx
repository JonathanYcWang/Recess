import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PrimitiveAlert, PrimitiveButton, PrimitivePanel } from '@/primitives';
import {
  applyPersonalizationQuizAnswer,
  frictionProfileFromScores,
  getPersonalizationQuizScenarioById,
  nextPersonalizationQuizScenarioId,
} from '@/modules/personalization-quiz';
import { getPetById } from '@/modules/pet-catalog';
import type { PersonalizationQuizProgress } from './personalizationQuizStorage';
import {
  clearPersonalizationQuizProgress,
  completePersonalizationQuiz,
  createEmptyPersonalizationQuizProgress,
  enrichFrictionFromPersonalizationQuiz,
  fetchCurrentWorkstyleProfile,
  loadPersonalizationQuizProgress,
  restoreFrictionBaseline,
  savePersonalizationQuizProgress,
} from './personalizationQuizStorage';
import styles from './PersonalizationQuizPage.module.css';
import BunnyWorkingImage from '../../assets/bunny-working.png';

const formatOutcome = (
  outcome: { kind: 'balanced' } | { kind: 'top-two'; dimensions: readonly [string, string] }
): string => {
  if (outcome.kind === 'balanced') {
    return 'Balanced';
  }
  return `${outcome.dimensions[0]} + ${outcome.dimensions[1]}`;
};

const PersonalizationQuizPage = () => {
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<PersonalizationQuizProgress | null>(null);
  const [completedOutcome, setCompletedOutcome] = useState<
    { kind: 'balanced' } | { kind: 'top-two'; dimensions: readonly [string, string] } | null
  >(null);
  const [activePetId, setActivePetId] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const profileResponse = await fetchCurrentWorkstyleProfile();
      if (
        !profileResponse?.ok ||
        !profileResponse.result?.ok ||
        !profileResponse.result.value.value.onboardingCompleted
      ) {
        navigate('/onboarding');
        return;
      }

      const profile = profileResponse.result.value.value;
      const saved = await loadPersonalizationQuizProgress();
      if (saved && !saved.dismissed) {
        setProgress(saved);
      } else if (profile.personalizationQuizOutcome) {
        setCompletedOutcome(profile.personalizationQuizOutcome);
        setActivePetId(profile.activePetId);
      } else {
        setProgress(createEmptyPersonalizationQuizProgress(profile.friction));
      }
      setLoaded(true);
    })();
  }, [navigate]);

  const persistProgress = (next: PersonalizationQuizProgress) => {
    setProgress(next);
    void savePersonalizationQuizProgress(next);
  };

  const handleDismiss = async () => {
    if (!progress) {
      navigate('/');
      return;
    }
    await savePersonalizationQuizProgress({ ...progress, dismissed: true });
    navigate('/');
  };

  const handleRestart = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const profileResponse = await fetchCurrentWorkstyleProfile();
      if (!profileResponse?.ok || !profileResponse.result?.ok) {
        setError('Could not restart the quiz. Try again.');
        return;
      }
      const baselineFriction = profileResponse.result.value.value.friction;
      const restored = await restoreFrictionBaseline(baselineFriction);
      if (!restored?.ok || !restored.result?.ok) {
        setError('Could not restart the quiz. Try again.');
        return;
      }
      const reset = createEmptyPersonalizationQuizProgress(baselineFriction);
      persistProgress(reset);
      setCompletedOutcome(null);
      setActivePetId(null);
    } catch {
      setError('Recess could not reach the background worker. Reload and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectOption = async (scenarioId: string, optionId: string) => {
    if (!progress || submitting) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const applied = applyPersonalizationQuizAnswer(
        progress.scores,
        progress.askedScenarioIds,
        scenarioId,
        optionId
      );
      if (!applied.ok) {
        setError('That answer could not be recorded. Try again.');
        return;
      }

      const friction = frictionProfileFromScores(applied.value.scores);
      const enriched = await enrichFrictionFromPersonalizationQuiz(friction);
      if (!enriched?.ok || !enriched.result?.ok) {
        setError('We could not update your workstyle profile. Try again.');
        return;
      }

      if (applied.value.result) {
        const completed = await completePersonalizationQuiz(applied.value.result);
        if (!completed?.ok || !completed.result?.ok) {
          setError('We could not save your quiz result. Try again.');
          return;
        }
        await clearPersonalizationQuizProgress();
        setProgress(null);
        setCompletedOutcome(applied.value.result);
        setActivePetId(completed.result.snapshot.value.activePetId);
        return;
      }

      persistProgress({
        ...progress,
        askedScenarioIds: applied.value.askedScenarioIds,
        scores: applied.value.scores,
        dismissed: false,
      });
    } catch {
      setError('Recess could not reach the background worker. Reload and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!loaded) {
    return <div className={styles.container}>Loading your quiz progress…</div>;
  }

  if (completedOutcome) {
    const activePet = activePetId ? getPetById(activePetId) : undefined;
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <h1>Meet your companion</h1>
          <p>
            {activePet
              ? `${activePet.name} is your current Recess companion.`
              : 'Your workstyle profile is enriched.'}
          </p>
        </header>
        <PrimitivePanel className={styles.section}>
          {activePet ? (
            <>
              <p className={styles.result}>{activePet.name}</p>
              <p>{activePet.personalityCopy}</p>
              <img src={BunnyWorkingImage} alt={activePet.moodAssets.calm.accessibleLabel} />
            </>
          ) : (
            <p className={styles.result}>Result: {formatOutcome(completedOutcome)}</p>
          )}
          <div className={styles.actions}>
            <PrimitiveButton onClick={() => navigate('/')}>Back to Recess</PrimitiveButton>
            <PrimitiveButton onClick={() => void handleRestart()}>Retake quiz</PrimitiveButton>
          </div>
        </PrimitivePanel>
      </div>
    );
  }

  if (!progress) {
    return null;
  }

  const currentScenarioId = nextPersonalizationQuizScenarioId(
    progress.askedScenarioIds,
    progress.scores
  );
  const scenario = currentScenarioId
    ? getPersonalizationQuizScenarioById(currentScenarioId)
    : undefined;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Personalization Quiz</h1>
        <p>
          Optional questions that refine how Recess understands your friction patterns. You can
          dismiss, resume later, or restart anytime.
        </p>
      </header>

      {scenario ? (
        <div aria-live="polite">
          <PrimitivePanel className={styles.section} aria-label="Personalization quiz question">
            <p className={styles.meta}>
              Question {progress.askedScenarioIds.length + 1} of up to 12
            </p>
            <h2>{scenario.text}</h2>
            <div className={styles.optionList} role="list">
              {scenario.options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={styles.option}
                  disabled={submitting}
                  onClick={() => void handleSelectOption(scenario.id, option.id)}
                >
                  {option.text}
                </button>
              ))}
            </div>
          </PrimitivePanel>
        </div>
      ) : (
        <PrimitivePanel className={styles.section}>
          <p>No further questions are available right now.</p>
        </PrimitivePanel>
      )}

      {error ? (
        <PrimitiveAlert variant="error" title="Could not update quiz">
          {error}
        </PrimitiveAlert>
      ) : null}

      <div className={styles.actions}>
        <PrimitiveButton onClick={() => void handleDismiss()}>Dismiss for now</PrimitiveButton>
        <PrimitiveButton isLoading={submitting} onClick={() => void handleRestart()}>
          {submitting ? 'Working…' : 'Restart quiz'}
        </PrimitiveButton>
      </div>
    </div>
  );
};

export default PersonalizationQuizPage;
