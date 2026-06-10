import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { SESSION_STATES } from '../../constants/constants';
import { selectSessionState } from '../../store/selectors';
import type { RootState } from '../../store';
import Icon from '../Icon/Icon';
import TimesIcon from '../../assets/times.svg?url';
import SettingsIcon from '../../assets/settings.svg?url';
import styles from './NavBar.module.css';

const NavBar = () => {
  const navigate = useNavigate();
  const sessionState = useSelector((state: RootState) => selectSessionState(state));
  const location = useLocation();

  const isOnSettingsPage = location.pathname.startsWith('/settings');
  const shouldHideSettingsButton =
    sessionState !== SESSION_STATES.BEFORE_WORK_SESSION &&
    sessionState !== SESSION_STATES.WORK_SESSION_COMPLETE;

  const handleBackToMain = () => {
    navigate('/');
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  return (
    <div className={styles.navBar}>
      <button
        aria-label="Go to home page"
        className={styles.logoButton}
        type="button"
        onClick={handleLogoClick}
      >
        <img alt="Recess" className={styles.logoImage} src="/assets/logo.png" />
      </button>
      {!shouldHideSettingsButton && (
        <div className={styles.closeButton}>
          <Icon
            src={isOnSettingsPage ? TimesIcon : SettingsIcon}
            alt="Close"
            size="md"
            onClick={isOnSettingsPage ? handleBackToMain : handleSettingsClick}
          />
        </div>
      )}
    </div>
  );
};

export default NavBar;
