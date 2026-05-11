import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import NavBar from '../../components/NavBar/NavBar';
import WorkHoursSettings from '../../components/WorkHoursSettings/WorkHoursSettings';
import BlockedSites from '../../components/BlockedSites/BlockedSites';
import styles from './SettingsPage.module.css';

type SettingsSectionId = 'work-hours' | 'blocked-sites';

type SettingsLocationState = {
  section?: SettingsSectionId;
};

const SettingsPage = () => {
  const location = useLocation();
  const locationState = location.state as SettingsLocationState | null;

  const sections = useMemo(
    () =>
      [
        {
          id: 'work-hours' as const,
          label: 'Work Hours',
        },
        {
          id: 'blocked-sites' as const,
          label: 'Blocked Sites',
        },
      ] satisfies Array<{ id: SettingsSectionId; label: string }>,
    []
  );

  const initialSection: SettingsSectionId =
    locationState?.section && sections.some((s) => s.id === locationState.section)
      ? locationState.section
      : 'work-hours';

  const [activeSection, setActiveSection] = useState<SettingsSectionId>(initialSection);

  const sectionFromState = locationState?.section;

  useEffect(() => {
    if (sectionFromState && sectionFromState !== activeSection) {
      setActiveSection(sectionFromState);
    }
  }, [sectionFromState, activeSection]);

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'work-hours':
        return <WorkHoursSettings />;
      case 'blocked-sites':
        return <BlockedSites />;
      default:
        return null;
    }
  };

  return (
    <div className={styles.settingsPage}>
      <div className={styles.topBar}>
        <NavBar />
      </div>

      <div className={styles.layout}>
        <nav className={styles.sidebar} aria-label="Settings">
          <div className={styles.sidebarHeader}>Settings</div>
          <div className={styles.navList} role="list">
            {sections.map((section) => {
              const isActive = section.id === activeSection;
              return (
                <button
                  key={section.id}
                  type="button"
                  className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                  onClick={() => setActiveSection(section.id)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className={styles.navItemLabel}>{section.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <div className={styles.main}>
          <div className={styles.mobileTabs} role="tablist" aria-label="Settings sections">
            {sections.map((section) => {
              const isActive = section.id === activeSection;
              return (
                <button
                  key={section.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`${styles.mobileTab} ${isActive ? styles.mobileTabActive : ''}`}
                  onClick={() => setActiveSection(section.id)}
                >
                  {section.label}
                </button>
              );
            })}
          </div>

          <div key={activeSection} className={styles.content}>
            {renderSectionContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
