import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { StorageProvider } from './storage/StorageContext';
import { useRoutePersistence } from './storage/useRoutePersistence';
import WelcomePage from './pages/WelcomePage';
import MainPage from './pages/MainPage';
import Settings from './pages/Settings';

function AppRoutes() {
  useRoutePersistence();

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
