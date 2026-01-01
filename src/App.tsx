import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { useRoutePersistenceRedux } from './store/hooks/useRoutePersistence';
import WelcomePage from './pages/WelcomePage';
import MainPage from './pages/MainPage';
import Settings from './pages/Settings';

function AppRoutes() {
  useRoutePersistenceRedux();

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
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
