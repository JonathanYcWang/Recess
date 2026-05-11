import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import CardCarousel, { CardCarouselItem } from '../../components/CardCarousel/CardCarousel';
import { completeOnboarding } from '../../store/actions/routingActions';
import type { AppDispatch } from '../../store';
import styles from './WelcomeView.module.css';

const WelcomeView = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

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
    // {
    //   id: '3',
    //   title: 'Not Sure?',
    //   description: 'Let us pick for you.',
    //   footer: 'Because picking is hard.',
    //   onClick: () => (Math.random() < 0.5 ? handleStart('/') : navigate('/quiz')),
    // },
  ];

  return (
    <div className={styles.welcomePage}>
      <div className={styles.headerContainer}>
        <div className={styles.logo}>
          <img alt="Recess" className={styles.logoImage} src="/assets/logo.png" />
        </div>
        <p className={styles.header}>Welcome to Recess!</p>
        <p className={styles.caption}>How would you like to get started?</p>
      </div>
      <CardCarousel cards={cards} />
    </div>
  );
};

export default WelcomeView;
