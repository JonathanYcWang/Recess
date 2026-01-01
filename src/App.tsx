import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from './store/hooks';
import WelcomePage from './pages/WelcomePage';
import MainPage from './pages/MainPage';
import Settings from './pages/Settings';

function AppRoutes() {
  const navigate = useNavigate();
  const hasOnboarded = useAppSelector((state) => state.routing.hasOnboarded);

  useEffect(() => {
    const currentPath = location.hash.slice(1) || '/';
    if (hasOnboarded && currentPath === '/') {
      navigate('/main', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
