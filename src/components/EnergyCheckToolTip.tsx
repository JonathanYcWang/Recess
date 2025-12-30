import React from 'react';
import InPainIcon from '../assets/emoji-in-pain.svg?url';
import MehIcon from '../assets/emoji-meh.svg?url';
import SmileIcon from '../assets/emoji-smile.svg?url';
import styles from './EnergyCheckToolTip.module.css';

interface EnergyCheckToolTipProps {}

const EnergyCheckToolTip: React.FC<EnergyCheckToolTipProps> = () => {
  return (
    <div className={styles.energyCheckToolTip}>
      <div className={styles.contentContainer}>
        <p className={styles.question}>How are you feeling?</p>
        <div className={styles.emotionsContainer}>
          <div className={styles.emotionIcon}>
            <div className={styles.emotionVector}>
              <img alt="" className={styles.emotionImage} src={InPainIcon} />
            </div>
          </div>
          <div className={styles.emotionIcon}>
            <div className={styles.emotionVector}>
              <img alt="" className={styles.emotionImage} src={MehIcon} />
            </div>
          </div>
          <div className={styles.emotionIcon}>
            <div className={styles.emotionVector}>
              <img alt="" className={styles.emotionImage} src={SmileIcon} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnergyCheckToolTip;
