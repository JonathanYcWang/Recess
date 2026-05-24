import { useNavigate } from 'react-router-dom';
import SessionDetailGrid from '@/components/SessionDetailGrid/SessionDetailGrid';
import Button from '../../components/Button/Button';
import styles from './HomePage.module.css';

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
        </div>
        <h1 className={styles.title}>Home Page</h1>
        <Button text="Go to Work" onClick={handleEnterWork} variant="primary" />
      </div>
    </main>
  );
};

export default HomePage;
