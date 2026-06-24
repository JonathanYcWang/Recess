import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { selectOnboardingCompleted } from '../../store/selectors/workstyleProfileProjectionSelectors';
// import PrizeWheel from '@/components/PrizeWheel/PrizeWheel';
import FocusPet from '@/components/FocusPet/FocusPet';
import WorkPage from '@/components/WorkPage/WorkPage';
import WorkHoursSettings from '@/components/WorkHoursSettings/WorkHoursSettings';
import BlockedSites from '@/components/BlockedSites/BlockedSites';
import InfoWidget from '@/components/InfoWidget/InfoWidget';
import styles from './HomePage.module.css';
// import {
//   CoconutWheelIcon,
//   ColorBombIcon,
//   FishIcon,
//   HammerIcon,
//   JackpotIcon,
//   LuckyCandyIcon,
//   StripedWrappedIcon,
//   SwitchIcon,
// } from '@/components/PrizeWheel/PrizeIcons';

import BunnyWorkingImage from '../../assets/bunny-working.png';

interface NavIconProps {
  className?: string;
}

const TimerIcon = ({ className }: NavIconProps) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M10 2h4" />
    <path d="M12 14l3-3" />
    <circle cx="12" cy="14" r="8" />
  </svg>
);

const CalendarIcon = ({ className }: NavIconProps) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M8 2v4" />
    <path d="M16 2v4" />
    <path d="M3 10h18" />
    <rect x="3" y="4" width="18" height="18" rx="2" />
  </svg>
);

const ShieldBanIcon = ({ className }: NavIconProps) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M8.5 8.5l7 7" />
    <path d="M15.5 8.5l-7 7" />
  </svg>
);

const BarChartIcon = ({ className }: NavIconProps) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3 3v18h18" />
    <path d="M8 17V9" />
    <path d="M13 17V5" />
    <path d="M18 17v-4" />
  </svg>
);

type MainSectionId = 'focus' | 'schedule' | 'blocked' | 'stats';

const navItems: {
  id: MainSectionId;
  label: string;
  icon: React.ComponentType<NavIconProps>;
}[] = [
  { id: 'focus', label: 'Focus', icon: TimerIcon },
  { id: 'schedule', label: 'Schedule', icon: CalendarIcon },
  { id: 'blocked', label: 'Blocked Sites', icon: ShieldBanIcon },
  { id: 'stats', label: 'Stats', icon: BarChartIcon },
];
const renderSectionContent = (mainContent: MainSectionId) => {
  switch (mainContent) {
    case 'focus':
      return <WorkPage />;
    case 'schedule':
      return <WorkHoursSettings />;
    case 'blocked':
      return <BlockedSites />;
    case 'stats':
      return <></>;
    default:
      return null;
  }
};

const HomePage = () => {
  const navigate = useNavigate();
  const onboardingCompleted = useSelector((state: RootState) => selectOnboardingCompleted(state));
  const [checkedOnboarding, setCheckedOnboarding] = useState(false);

  useEffect(() => {
    if (onboardingCompleted) {
      setCheckedOnboarding(true);
      return;
    }
    void chrome.runtime
      .sendMessage({
        channel: 'recess.workstyle-profile.runtime.v1',
        action: 'current',
      })
      .then((response) => {
        const completed = Boolean(
          response?.ok && response.result?.ok && response.result.value.value.onboardingCompleted
        );
        if (!completed) {
          navigate('/onboarding');
        }
        setCheckedOnboarding(true);
      })
      .catch(() => {
        navigate('/onboarding');
        setCheckedOnboarding(true);
      });
  }, [navigate, onboardingCompleted]);

  const handleGoHome = () => {
    navigate('/');
  };

  const [mainContent, setMainContent] = useState<MainSectionId>('focus');
  if (!checkedOnboarding && !onboardingCompleted) {
    return null;
  }
  return (
    <div className={styles.homePage}>
      <div className={styles.layout}>
        <aside className={styles.desktopSidebar} aria-label="Primary navigation">
          <div className={styles.sidebarTop}>
            <button
              aria-label="Go to home page"
              className={styles.brand}
              type="button"
              onClick={handleGoHome}
            >
              <img alt="Recess" className={styles.brandIconSvg} src="/assets/logo.png" />
              <span className={styles.brandText}>Recess</span>
            </button>
            <nav className={styles.navList}>
              {navItems.map((item) => (
                <button
                  key={item.id}
                  className={`${styles.navButton} ${
                    item.id === mainContent ? styles.navButtonActive : ''
                  }`}
                  type="button"
                  onClick={() => setMainContent(item.id)}
                >
                  <item.icon className={styles.navIcon} />
                  <span className={styles.navText}>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>
        <main className={styles.mainPane}>
          <div className={styles.content}>
            <header className={styles.header}>
              <div>
                <h1 className={styles.title}>Good morning, Alice</h1>
                <p className={styles.subtitle}>Currently in a deep work session...</p>
              </div>
              <div className={styles.profile}>
                <div className={styles.profileCopy}>
                  <p className={styles.profileLevel}>Level 12</p>
                  <p className={styles.profileXp}>1,240 XP</p>
                </div>
                <div className={styles.avatar}>A</div>
              </div>
            </header>
            <div className={styles.dashboardGrid}>
              <section className={`${styles.card} ${styles.primaryPanel} ${styles.box}`}>
                {renderSectionContent(mainContent)}
                {/* 
                <PrizeWheel
                  segments={[
                    { label: 'Color Bomb', icon: <ColorBombIcon /> },
                    { label: 'Lollipop Hammer', icon: <HammerIcon /> },
                    { label: 'Jelly Fish', icon: <FishIcon /> },
                    { label: 'Free Switch', icon: <SwitchIcon /> },
                    {
                      label: 'Striped & Wrapped',
                      icon: <StripedWrappedIcon />,
                    },
                    { label: 'Coconut Wheel', icon: <CoconutWheelIcon /> },
                    {
                      label: 'Lucky Candy',
                      icon: <LuckyCandyIcon />,
                    },
                    {
                      label: 'JACKPOT',
                      icon: <JackpotIcon />,
                      isJackpot: true,
                    },
                  ]}
                /> */}
              </section>
              <aside className={styles.rightColumn}>
                <section className={styles.card}>
                  <InfoWidget
                    primaryValue={{ name: 'Freshness Score', value: 100 }}
                    items={[
                      { name: 'Freshness Score', value: 100 },
                      { name: 'Readiness Score', value: 100 },
                      { name: 'Momentum Multiplier', value: 1.5 },
                      { name: 'Last Session Difficulty', value: 80 },
                    ]}
                  />
                </section>
                <section className={styles.card}>
                  {/* <Slots
                    reels={[
                      {
                        id: 'platform',
                        label: 'Reward',
                        values: [
                          'Notion',
                          'Figma',
                          'Reddit',
                          'Twitch',
                          'Pinterest',
                          'Zoom',
                          'LinkedIn',
                        ],
                      },
                      {
                        id: 'scale',
                        label: 'Time',
                        values: ['5 min', '10 min', '15 min', '20 min', '25 min', '30 min'],
                      },
                    ]}
                  /> */}
                  <FocusPet petName={'Theo'} imgSrc={BunnyWorkingImage} />
                </section>
              </aside>
            </div>
          </div>
        </main>
        {/* <nav className={styles.mobileNav} aria-label="Primary navigation">
          {navItems.map((item) => (
            <button
              key={item.id}
              aria-label={item.label}
              className={`${styles.mobileNavButton} ${
                item.id === 'focus' ? styles.mobileNavButtonActive : ''
              }`}
              type="button"
            >
              <item.icon className={styles.mobileNavIcon} />
            </button>
          ))}
        </nav> */}
      </div>
    </div>
  );
};

export default HomePage;
