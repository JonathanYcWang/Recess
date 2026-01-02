import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { useTimer } from '../store/hooks/useTimer';
import MainLogoPng from './MainLogoPng';
import Icon from './Icon';
import TertiaryButton from './TertiaryButton';
import TimesIcon from '../assets/times.svg?url';
import styles from './NavBar.module.css';

interface NavBarProps {}

const NavBar: React.FC<NavBarProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isInWorkingSession = useAppSelector((state) => state.blockedSites.isInWorkingSession);
  const { completeWorkSessionEarly } = useTimer();

  const isOnSettingsPage = location.pathname.startsWith('/settings');

  const handleBackToMain = () => {
    navigate('/');
  };

  const handleWorkHoursClick = () => {
    navigate('/settings/work-hours');
  };

  const handleBlockedSitesClick = () => {
    navigate('/settings/blocked-sites');
  };

  const handleCompleteWorkSession = () => {
    if (
      confirm(
        'Are you sure you want to exit the working session? This will mark your work session as complete and turn off site blocking.'
      )
    ) {
      completeWorkSessionEarly();
    }
  };

  return (
    <div className={styles.navBar}>
      <MainLogoPng />

      {isOnSettingsPage ? (
        <div className={styles.closeButton}>
          <Icon src={TimesIcon} alt="Close" size={20} onClick={handleBackToMain} />
        </div>
      ) : (
        <>
          <div className={styles.tertiaryButtonsContainer}>
            {isInWorkingSession && (
              <TertiaryButton text="Exit Work Session" onClick={handleCompleteWorkSession} />
            )}
            <TertiaryButton text="Work Hours" onClick={handleWorkHoursClick} />
            <TertiaryButton text="Blocked Sites" onClick={handleBlockedSitesClick} />
            <TertiaryButton
              text="Reset"
              onClick={async () => {
                if (
                  confirm(
                    'Are you sure you want to reset all storage? This will clear all timers and settings.'
                  )
                ) {
                  // Clear Chrome storage
                  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                    await chrome.storage.local.clear();
                  }
                  // Clear localStorage fallback
                  localStorage.clear();

                  // Reload the page to reinitialize with defaults
                  window.location.reload();
                }
              }}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default NavBar;
