import React from 'react';
import { Dialog } from '@mui/material';
import Icon from './Icon';
import InPainIcon from '../assets/emoji-in-pain.svg?url';
import MehIcon from '../assets/emoji-meh.svg?url';
import SmileIcon from '../assets/emoji-smile.svg?url';
import TimesIcon from '../assets/times.svg?url';
import styles from './EnergyCheckDialog.module.css';

interface EnergyCheckDialogProps {
  open: boolean;
  onClose: () => void;
  onEmojiSelect: (emoji: 'pain' | 'meh' | 'smile') => void;
}

const EnergyCheckDialog: React.FC<EnergyCheckDialogProps> = ({ open, onClose, onEmojiSelect }) => {
  const handleEmojiClick = (emoji: 'pain' | 'meh' | 'smile') => {
    onEmojiSelect(emoji);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: 2,
          padding: '24px',
          minWidth: '280px',
        },
      }}
    >
      <div className={styles.dialogContent}>
        <div className={styles.closeButton}>
          <Icon src={TimesIcon} alt="Close" size={20} onClick={onClose} />
        </div>
        <div className={styles.contentContainer}>
          <p className={styles.question}>How are you feeling?</p>
          <div className={styles.emotionsContainer}>
            <div className={styles.emotionIcon} onClick={() => handleEmojiClick('pain')}>
              <div className={styles.emotionVector}>
                <img alt="In pain" className={styles.emotionImage} src={InPainIcon} />
              </div>
            </div>
            <div className={styles.emotionIcon} onClick={() => handleEmojiClick('meh')}>
              <div className={styles.emotionVector}>
                <img alt="Meh" className={styles.emotionImage} src={MehIcon} />
              </div>
            </div>
            <div className={styles.emotionIcon} onClick={() => handleEmojiClick('smile')}>
              <div className={styles.emotionVector}>
                <img alt="Happy" className={styles.emotionImage} src={SmileIcon} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default EnergyCheckDialog;
