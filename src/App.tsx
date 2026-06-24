import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage/HomePage';
import OnboardingPage from './pages/OnboardingPage/OnboardingPage';

const App = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/quiz" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
