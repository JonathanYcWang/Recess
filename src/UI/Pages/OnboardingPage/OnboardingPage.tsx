import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../Components/Button/Button';
import {
  ENERGY_LEVELS,
  FRICTION_DIMENSIONS,
  PREFERRED_CADENCES,
  type EnergyLevel,
  type FrictionDimension,
  type PreferredCadence,
} from '@/modules/workstyle-profile';
import styles from './OnboardingPage.module.css';

const ONBOARDING_PROGRESS_KEY = '__recess_onboarding_progress';

type OnboardingDraft = {
  step: number;
  energy: EnergyLevel | null;
  cadence: PreferredCadence | null;
  primaryFriction: FrictionDimension | null;
};

const FRICTION_LABELS: Record<FrictionDimension, string> = {
  'emotional-load': 'Emotional load',
  motivation: 'Motivation',
  organization: 'Organization',
  distraction: 'Distraction',
  starting: 'Getting started',
  fatigue: 'Fatigue',
};

const ENERGY_LABELS: Record<EnergyLevel, string> = {
  low: 'Low — I need shorter focus and longer recovery',
  steady: 'Steady — balanced focus and recovery',
  high: 'High — I can push longer before recovery',
};

const CADENCE_LABELS: Record<PreferredCadence, string> = {
  '15/5': '15 minutes focus, 5 minutes recess',
  '25/5': '25 minutes focus, 5 minutes recess',
  '45/10': '45 minutes focus, 10 minutes recess',
};

const defaultDraft = (): OnboardingDraft => ({
  step: 0,
  energy: null,
  cadence: null,
  primaryFriction: null,
});

const loadDraft = async (): Promise<OnboardingDraft> => {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    return defaultDraft();
  }
  const stored = await chrome.storage.local.get(ONBOARDING_PROGRESS_KEY);
  const draft = stored[ONBOARDING_PROGRESS_KEY];
  if (!draft || typeof draft !== 'object') {
    return defaultDraft();
  }
  return { ...defaultDraft(), ...(draft as OnboardingDraft) };
};

const saveDraft = async (draft: OnboardingDraft): Promise<void> => {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    return;
  }
  await chrome.storage.local.set({ [ONBOARDING_PROGRESS_KEY]: draft });
};

const clearDraft = async (): Promise<void> => {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    return;
  }
  await chrome.storage.local.remove(ONBOARDING_PROGRESS_KEY);
};

const OnboardingPage = () => {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<OnboardingDraft>(defaultDraft);
  const [loaded, setLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadDraft().then((saved) => {
      setDraft(saved);
      setLoaded(true);
    });
  }, []);

  const updateDraft = (next: OnboardingDraft) => {
    setDraft(next);
    void saveDraft(next);
  };

  const handleRestart = () => {
    const reset = defaultDraft();
    setDraft(reset);
    void saveDraft(reset);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!draft.energy || !draft.cadence || !draft.primaryFriction) {
      setError('Choose your energy, cadence, and primary friction before continuing.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const response = await chrome.runtime.sendMessage({
        channel: 'recess.workstyle-profile.runtime.v1',
        action: 'command',
        envelope: {
          protocolVersion: 1,
          commandId: `onboarding-${Date.now()}`,
          module: 'workstyle-profile',
          command: {
            kind: 'initialize-from-onboarding',
            energy: draft.energy,
            cadence: draft.cadence,
            primaryFriction: draft.primaryFriction,
          },
        },
      });
      if (!response?.ok || !response.result?.ok) {
        setError('We could not save your workstyle setup. Try again.');
        return;
      }
      await clearDraft();
      navigate('/');
    } catch {
      setError('Recess could not reach the background worker. Reload and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!loaded) {
    return <div className={styles.container}>Loading your onboarding progress…</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Welcome to Recess</h1>
        <p>Answer three quick questions so Recess can adapt focus and recovery to how you work.</p>
      </header>

      {draft.step === 0 && (
        <section className={styles.section}>
          <h2>How is your energy right now?</h2>
          <div className={styles.optionList}>
            {ENERGY_LEVELS.map((energy) => (
              <button
                key={energy}
                type="button"
                className={draft.energy === energy ? styles.optionSelected : styles.option}
                onClick={() => updateDraft({ ...draft, energy, step: 1 })}
              >
                {ENERGY_LABELS[energy]}
              </button>
            ))}
          </div>
        </section>
      )}

      {draft.step === 1 && draft.energy && (
        <section className={styles.section}>
          <h2>Which focus rhythm feels most natural?</h2>
          <div className={styles.optionList}>
            {PREFERRED_CADENCES.map((cadence) => (
              <button
                key={cadence}
                type="button"
                className={draft.cadence === cadence ? styles.optionSelected : styles.option}
                onClick={() => updateDraft({ ...draft, cadence, step: 2 })}
              >
                {CADENCE_LABELS[cadence]}
              </button>
            ))}
          </div>
          <Button
            text="Back"
            onClick={() => updateDraft({ ...draft, step: 0 })}
            variant="primary"
          />
        </section>
      )}

      {draft.step === 2 && draft.energy && draft.cadence && (
        <section className={styles.section}>
          <h2>What gets in the way most often?</h2>
          <div className={styles.optionList}>
            {FRICTION_DIMENSIONS.map((friction) => (
              <button
                key={friction}
                type="button"
                className={
                  draft.primaryFriction === friction ? styles.optionSelected : styles.option
                }
                onClick={() => updateDraft({ ...draft, primaryFriction: friction, step: 3 })}
              >
                {FRICTION_LABELS[friction]}
              </button>
            ))}
          </div>
          <Button
            text="Back"
            onClick={() => updateDraft({ ...draft, step: 1 })}
            variant="primary"
          />
        </section>
      )}

      {draft.step === 3 && draft.energy && draft.cadence && draft.primaryFriction && (
        <section className={styles.section}>
          <h2>Ready to begin</h2>
          <ul className={styles.summary}>
            <li>Energy: {ENERGY_LABELS[draft.energy]}</li>
            <li>Cadence: {CADENCE_LABELS[draft.cadence]}</li>
            <li>Primary friction: {FRICTION_LABELS[draft.primaryFriction]}</li>
          </ul>
          {error ? <p className={styles.error}>{error}</p> : null}
          <div className={styles.actions}>
            <Button
              text={submitting ? 'Saving…' : 'Start Recess'}
              onClick={() => void handleSubmit()}
              variant="primary"
            />
            <Button
              text="Back"
              onClick={() => updateDraft({ ...draft, step: 2 })}
              variant="primary"
            />
            <Button text="Start over" onClick={handleRestart} variant="primary" />
          </div>
        </section>
      )}
    </div>
  );
};

export default OnboardingPage;
