import NavBar from '../../components/NavBar/NavBar';
import BlockedSites from '../../components/BlockedSites/BlockedSites';
import styles from './BlockedSitesPage.module.css';

const BlockedSitesPage = () => {
  return (
    <div className={styles.settingsPage}>
      <NavBar />
      <BlockedSites />
    </div>
  );
};

export default BlockedSitesPage;
