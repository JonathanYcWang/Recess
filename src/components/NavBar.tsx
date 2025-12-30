import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu } from '@mui/material';
import MainLogoPng from './MainLogoPng';
import Icon from './Icon';
import SecondaryButton from './SecondaryButton';
import EnergyCheckToolTip from './EnergyCheckToolTip';
import { usePopupMode } from '../hooks/usePopupMode';
import BoltIcon from '../assets/bolt.svg?url';
import SettingsIcon from '../assets/settings.svg?url';
import ExpandArrowsIcon from '../assets/expand-arrows.svg?url';
import styles from './NavBar.module.css';

interface NavBarProps {
  energyLevel?: string;
}

const NavBar: React.FC<NavBarProps> = ({ energyLevel = 'High' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isPopup = usePopupMode();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleOpenInNewTab = () => {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.tabs) {
      // Get the current hash route (HashRouter uses hash for routing)
      const currentHash = window.location.hash || '#/';
      const extensionUrl = chrome.runtime.getURL(`index.html${currentHash}`);
      chrome.tabs.create({ url: extensionUrl });
    }
  };

  const handleSettingsClick = () => {
    if (location.pathname === '/settings') {
      navigate('/main');
    } else {
      navigate('/settings');
    }
  };

  return (
    <div className={styles.navBar}>
      <MainLogoPng />
      {!isPopup && (
        <div className={styles.energyButtonWrapper}>
          <div onClick={handleClick}>
            <SecondaryButton text={`Energy ${energyLevel}`} iconSrc={BoltIcon} />
          </div>
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            slotProps={{
              paper: {
                elevation: 0,
                sx: {
                  overflow: 'visible',
                  filter: 'drop-shadow(0px 2px 8px rgba(0, 0, 0, 0.14))',
                  mt: 1.5,
                  borderRadius: 2,
                  '&::before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    right: 75,
                    width: 10,
                    height: 10,
                    bgcolor: 'background.paper',
                    transform: 'translateY(-50%) rotate(45deg)',
                    zIndex: 0,
                  },
                },
              },
            }}
            transformOrigin={{ horizontal: 'center', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
          >
            <EnergyCheckToolTip />
          </Menu>
        </div>
      )}
      <div className={styles.expandButton}>
        <Icon src={ExpandArrowsIcon} alt="Open in new tab" size={28} onClick={handleOpenInNewTab} />
      </div>
      {!isPopup && (
        <div className={styles.settingsButton}>
          <Icon src={SettingsIcon} alt="Settings" size={28} onClick={handleSettingsClick} />
        </div>
      )}
    </div>
  );
};

export default NavBar;
