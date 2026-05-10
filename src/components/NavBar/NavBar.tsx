import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsInWorkingSession } from '../../store/selectors';
import type { RootState } from '../../store';
import { useTimer } from '../../hooks/useTimer';
import Icon from '../Icon/Icon';
import Button from '../Button/Button';
import TimesIcon from '../../assets/times.svg?url';
import styles from './NavBar.module.css';

interface NavBarProps {}

const NavBar: React.FC<NavBarProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isInWorkingSession = useSelector((state: RootState) => selectIsInWorkingSession(state));
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
      <div className={styles.logo}>
        <img
          alt="Recess"
          className={styles.logoImage}
          src="/assets/logo.png"
        />
      </div>

      {isOnSettingsPage ? (
        <div className={styles.closeButton}>
          <Icon src={TimesIcon} alt="Close" size={20} onClick={handleBackToMain} />
        </div>
      ) : (
        <>
          <div className={styles.tertiaryButtonsContainer}>
            {isInWorkingSession && (
              <Button
                text="Exit Work Session"
                onClick={handleCompleteWorkSession}
                variant="tertiary"
              />
            )}
            <Button text="Work Hours" onClick={handleWorkHoursClick} variant="tertiary" />
            <Button text="Blocked Sites" onClick={handleBlockedSitesClick} variant="tertiary" />
            <Button
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
              variant="tertiary"
            />
          </div>
        </>
      )}
    </div>
  );
};

export default NavBar;
