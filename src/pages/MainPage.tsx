import React from 'react';
import NavBar from '../components/NavBar';
import SecondaryTimerDescription from '../components/SecondaryTimerDescription';
import CountdownTimer from '../components/CountdownTimer';
import PrimaryButton from '../components/PrimaryButton';
import SecondaryButton from '../components/SecondaryButton';
import TertiaryButton from '../components/TertiaryButton';
import CardCarousel, { CardCarouselItem } from '../components/CardCarousel';
import RewardLink from '../components/RewardLink';
import PauseIcon from '../assets/pause.svg?url';
import PlayIcon from '../assets/play.svg?url';
import { useTimer } from '../store/hooks/useTimer';
import { DEFAULT_FOCUS_TIME } from '../lib/constants';
import { formatWorkSessionTime } from '../lib/timer-utils';
import styles from './MainPage.module.css';

const MainPage: React.FC = () => {
  const {
    timerState,
    startFocusSession,
    pauseSession,
    resumeSession,
    selectReward,
    handleReroll,
    endSessionEarly,
    resetTimerState,
    rewards,
    formatTime,
    isLoaded,
  } = useTimer();

  const {
    sessionState,
    focusSessionDurationRemaining,
    breakSessionDurationRemaining,
    backToItTimeRemaining,
    rerolls,
    selectedReward,
    workSessionDurationRemaining,
    pausedFrom,
  } = timerState;

  // Show loading state until timer state is loaded
  if (!isLoaded) {
    return (
      <div className={styles.mainPage}>
        <NavBar />
        <div>Loading...</div>
      </div>
    );
  }

  const renderContent = () => {
    switch (sessionState) {
      case 'BEFORE_SESSION':
        return (
          <>
            <SecondaryTimerDescription
              text={`${formatWorkSessionTime(workSessionDurationRemaining)} To Go`}
            />
            <CountdownTimer time={formatTime(DEFAULT_FOCUS_TIME)} label="Next session length" />
            <PrimaryButton text="Start Session" onClick={startFocusSession} iconSrc={PlayIcon} />
          </>
        );

      case 'DURING_SESSION':
        return (
          <>
            <SecondaryTimerDescription text="Active Session" />
            <CountdownTimer time={formatTime(focusSessionDurationRemaining)} label="Remaining" />
            <SecondaryButton text="Pause Session" onClick={pauseSession} iconSrc={PauseIcon} />
          </>
        );

      case 'PAUSED':
        const pausedTime =
          pausedFrom === 'BACK_TO_IT' ? backToItTimeRemaining : focusSessionDurationRemaining;
        const pausedLabel = pausedFrom === 'BACK_TO_IT' ? 'starting in' : 'Remaining';

        return (
          <>
            <SecondaryTimerDescription text="Paused Session" />
            <CountdownTimer time={formatTime(pausedTime)} label={pausedLabel} />
            <div className={styles.contentContainer}>
              <PrimaryButton text="Resume Session" onClick={resumeSession} iconSrc={PlayIcon} />
              <TertiaryButton text="Wrap up session early" onClick={endSessionEarly} />
            </div>
          </>
        );

      case 'REWARD_SELECTION':
        const rewardCards: CardCarouselItem[] = rewards.map((reward: any, index: number) => ({
          id: reward.id,
          title: reward.duration,
          description: reward.name,
          onClick: () => selectReward(reward),
          refreshOnClick: () => handleReroll(index),
        }));

        return (
          <>
            <div className={styles.headerContainer}>
              <p className={styles.header}>Break Time!</p>
              <p className={styles.caption}>Choose how you recharge.</p>
            </div>
            <div className={styles.contentContainer}>
              <SecondaryTimerDescription text={`Re-rolls left: ${rerolls}`} />
              <CardCarousel cards={rewardCards} />
            </div>
          </>
        );

      case 'BREAK':
        return (
          <>
            <div className={styles.headerContainer}>
              <p className={styles.header}>Time To Recharge</p>
              <p className={styles.caption}>
                Give your brain a pause, and you'll crush the next session.
              </p>
            </div>
            <CountdownTimer time={formatTime(breakSessionDurationRemaining)} label="Remaining" />
            <div className={styles.contentContainer}>
              {selectedReward && (
                <RewardLink siteName={selectedReward.name} status="Site Unlocked" />
              )}
              <TertiaryButton text="Wrap up session early" onClick={endSessionEarly} />
            </div>
            <div className={styles.illustration}>
              <div className={styles.illustrationContainer}>
                <img src="/assets/cow.png" alt="Cow illustration" className={styles.cowImage} />
              </div>
            </div>
          </>
        );

      case 'BACK_TO_IT':
        return (
          <>
            <div className={styles.headerContainer}>
              <p className={styles.header}>Alright, Back To It.</p>
              <p className={styles.caption}>Next focus session is starting soon.</p>
            </div>
            <SecondaryTimerDescription
              text={`${formatWorkSessionTime(workSessionDurationRemaining)} To Go`}
            />
            <CountdownTimer time={formatTime(backToItTimeRemaining)} label="starting in" />
            <div className={styles.contentContainer}>
              <PrimaryButton text="Start Session" onClick={startFocusSession} iconSrc={PlayIcon} />
              <SecondaryButton text="Hold On" onClick={pauseSession} iconSrc={PauseIcon} />
            </div>
          </>
        );

      case 'SESSION_COMPLETE':
        return (
          <>
            <div className={styles.headerContainer}>
              <p className={styles.header}>Congrats!</p>
              <p className={styles.caption}>You've completed your work session for today.</p>
            </div>
            <div className={styles.contentContainer}>
              <PrimaryButton
                text="Reset & Start Fresh"
                onClick={resetTimerState}
                iconSrc={PlayIcon}
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.mainPage}>
      <NavBar />
      {renderContent()}
    </div>
  );
};

export default MainPage;
