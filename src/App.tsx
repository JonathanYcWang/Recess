import { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { StorageProvider } from './storage/StorageContext';
import { useRoutePersistence } from './storage/useRoutePersistence';
import { usePopupMode } from './hooks/usePopupMode';
import { useTimerState } from './storage';
import { shouldRedirectPopupToNewTab, getTargetHashForRedirect } from './utils/popupRedirect';
import WelcomePage from './pages/WelcomePage';
import MainPage from './pages/MainPage';
import Settings from './pages/Settings';

function AppRoutes() {
  useRoutePersistence();
  const isPopup = usePopupMode();
  const location = useLocation();
  const { timerState, isLoaded } = useTimerState();

  useEffect(() => {
    // If in popup mode and state should open in new tab, redirect
    if (isLoaded && isPopup && typeof chrome !== 'undefined' && chrome.runtime && chrome.tabs) {
      const shouldRedirect = shouldRedirectPopupToNewTab(
        timerState.sessionState,
        location.pathname
      );

      if (shouldRedirect) {
        const targetHash = getTargetHashForRedirect(timerState.sessionState, location.pathname);
        const extensionUrl = chrome.runtime.getURL(`index.html${targetHash}`);
        chrome.tabs.create({ url: extensionUrl });
        window.close(); // Close the popup
      }
    }
  }, [isLoaded, isPopup, timerState.sessionState, location.pathname]);

  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/main" element={<MainPage />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  );
}

function App() {
  return (
    <StorageProvider>
      <Router>
        <AppRoutes />
      </Router>
    </StorageProvider>
  );
}

export default App;
