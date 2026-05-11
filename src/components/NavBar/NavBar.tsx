import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsInWorkingSession } from '../../store/selectors';
import type { RootState } from '../../store';
import Icon from '../Icon/Icon';
import TimesIcon from '../../assets/times.svg?url';
import SettingsIcon from '../../assets/settings.svg?url';
import styles from './NavBar.module.css';

const NavBar = () => {
  const navigate = useNavigate();
  const isInWorkingSession = useSelector((state: RootState) => selectIsInWorkingSession(state));
  const location = useLocation();

  const isOnSettingsPage = location.pathname.startsWith('/settings');

  const handleBackToMain = () => {
    navigate('/');
  };

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  return (
    <div className={styles.navBar}>
      <div className={styles.logo}>
        <img alt="Recess" className={styles.logoImage} src="/assets/logo.png" />
      </div>
      {!isInWorkingSession && (
        <div className={styles.closeButton}>
          <Icon
            src={isOnSettingsPage ? TimesIcon : SettingsIcon}
            alt="Close"
            size={20}
            onClick={isOnSettingsPage ? handleBackToMain : handleSettingsClick}
          />
        </div>
      )}
    </div>
  );
};

export default NavBar;
