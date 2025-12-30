import React from 'react';
import styles from './MainLogoPng.module.css';

interface MainLogoPngProps {
}

const MainLogoPng: React.FC<MainLogoPngProps> = () => {
  return (
    <div className={styles.mainLogoPng}>
      <img 
        alt="" 
        className={styles.image} 
        src="/assets/logo.png" 
      />
    </div>
  );
};

export default MainLogoPng;

