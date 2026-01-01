import React from 'react';
import NavBar from '../components/NavBar';
import BlockedSites from '../components/BlockedSites';
import styles from './Settings.module.css';

const BlockedSitesPage: React.FC = () => {
  return (
    <div className={styles.settingsPage}>
      <NavBar />
      <BlockedSites />
    </div>
  );
};

export default BlockedSitesPage;
