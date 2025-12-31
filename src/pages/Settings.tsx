import React, { useState } from 'react';
import NavBar from '../components/NavBar';
import WorkHoursSettings from '../components/WorkHoursSettings';
import BlockedSites from '../components/BlockedSites';
import TertiaryButton from '../components/TertiaryButton';
import styles from './Settings.module.css';

type TabType = 'workHours' | 'blockedSites';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('workHours');

  const handleResetStorage = async () => {
    if (confirm('Are you sure you want to reset all storage? This will clear all timers and settings.')) {
      // Clear Chrome storage
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.clear();
      }
      // Clear localStorage fallback
      localStorage.clear();
      
      // Reload the page to reinitialize with defaults
      window.location.reload();
    }
  };

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
      
      <div style={{ marginTop: '40px', padding: '0 20px' }}>
        <TertiaryButton text="Reset All Storage (Testing)" onClick={handleResetStorage} />
      </div>
    </div>
  );
};

export default Settings;
