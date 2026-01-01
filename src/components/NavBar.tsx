import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MainLogoPng from './MainLogoPng';
import Icon from './Icon';
import TertiaryButton from './TertiaryButton';
import TimesIcon from '../assets/times.svg?url';
import styles from './NavBar.module.css';

interface NavBarProps {}

const NavBar: React.FC<NavBarProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();

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
