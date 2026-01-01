import React from 'react';
import { useNavigate } from 'react-router-dom';
import MainLogoPng from '../../components/MainLogoPng';
import CardCarousel, { CardCarouselItem } from '../../components/CardCarousel';
import { useAppDispatch } from '../../store/hooks';
import { completeOnboarding } from '../../store/slices/routingSlice';
import styles from '../WelcomePage.module.css';

const WelcomeView: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const handleStart = (path: string) => {
    dispatch(completeOnboarding());
    navigate(path);
  };

  const cards: CardCarouselItem[] = [
    {
      id: '1',
      title: 'Find Your Working Type',
      description: 'Take a short quiz to tune your work sessions to how you work best.',
      footer: 'Plus, a surprise companion is waiting for you!',
      onClick: () => navigate('/quiz'),
    },
    {
      id: '2',
      title: 'Jump In and Get Started',
      description: 'Start your first focus session now.',
      footer: "Don't worry, you can always do the quiz later.",
      onClick: () => handleStart('/'),
    },
    {
      id: '3',
      title: 'Not Sure?',
      description: 'Let us pick for you.',
      footer: 'Because picking is hard.',
      onClick: () => handleStart('/'),
    },
  ];

  return (
    <div className={styles.welcomePage}>
      <div className={styles.headerContainer}>
        <MainLogoPng />
        <p className={styles.header}>Welcome to Recess!</p>
        <p className={styles.caption}>How would you like to get started?</p>
      </div>
      <CardCarousel cards={cards} />
    </div>
  );
};

export default WelcomeView;
