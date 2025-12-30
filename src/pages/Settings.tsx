import React, { useState } from 'react';
import NavBar from '../components/NavBar';
import WorkHoursSettings from '../components/WorkHoursSettings';
import BlockedSites from '../components/BlockedSites';
import styles from './Settings.module.css';

type TabType = 'workHours' | 'blockedSites';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('workHours');

  return (
    <div className={styles.settingsPage}>
      <NavBar />
      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tab} ${activeTab === 'workHours' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('workHours')}
        >
          Work Hours
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'blockedSites' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('blockedSites')}
        >
          Blocked Sites
        </button>
      </div>
      {activeTab === 'workHours' && <WorkHoursSettings />}
      {activeTab === 'blockedSites' && <BlockedSites />}
    </div>
  );
};

export default Settings;
