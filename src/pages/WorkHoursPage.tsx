import React from 'react';
import NavBar from '../components/NavBar';
import WorkHoursSettings from '../components/WorkHoursSettings';
import styles from './Settings.module.css';

const WorkHoursPage: React.FC = () => {
  return (
    <div className={styles.settingsPage}>
      <NavBar />
      <WorkHoursSettings />
    </div>
  );
};

export default WorkHoursPage;
