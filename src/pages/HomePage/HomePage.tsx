import { useNavigate } from 'react-router-dom';
import Button from '@/components/Button/Button';
import PrizeWheel from '@/components/PrizeWheel/PrizeWheel';
import SessionDetailGrid from '@/components/SessionDetailGrid/SessionDetailGrid';
import styles from './HomePage.module.css';
import {
  CoconutWheelIcon,
  ColorBombIcon,
  FishIcon,
  HammerIcon,
  JackpotIcon,
  LuckyCandyIcon,
  StripedWrappedIcon,
  SwitchIcon,
} from '@/components/PrizeWheel/PrizeIcons';

const HomePage = () => {
  const navigate = useNavigate();

  const handleEnterWork = () => {
    navigate('/work');
  };

  return (
    <main className={styles.homePage}>
      <div className={styles.content}>
        <div className={styles.shell}>
          <SessionDetailGrid />
          <PrizeWheel
            segments={[
              { label: 'Color Bomb', icon: <ColorBombIcon /> },
              { label: 'Lollipop Hammer', icon: <HammerIcon /> },
              { label: 'Jelly Fish', icon: <FishIcon /> },
              { label: 'Free Switch', icon: <SwitchIcon /> },
              {
                label: 'Striped & Wrapped',
                icon: <StripedWrappedIcon />,
              },
              { label: 'Coconut Wheel', icon: <CoconutWheelIcon /> },
              {
                label: 'Lucky Candy',
                icon: <LuckyCandyIcon />,
              },
              {
                label: 'JACKPOT',
                icon: <JackpotIcon />,
                isJackpot: true,
              },
            ]}
          />
        </div>
        <h1 className={styles.title}>Home Page</h1>
        <Button text="Go to Work" onClick={handleEnterWork} variant="primary" />
      </div>
    </main>
  );
};

export default HomePage;
