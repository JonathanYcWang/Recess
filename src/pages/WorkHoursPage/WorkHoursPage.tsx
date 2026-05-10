import React from 'react';
import NavBar from '../../components/NavBar/NavBar';
import WorkHoursSettings from '../../components/WorkHoursSettings/WorkHoursSettings';
import styles from './WorkHoursPage.module.css';

const WorkHoursPage: React.FC = () => {
  return (
    <div className={styles.settingsPage}>
      <NavBar />
      <WorkHoursSettings />
    </div>
  );
};

export default WorkHoursPage;
