import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeApplier } from '@/components/ThemeApplier/ThemeApplier';
import HomePage from './pages/HomePage/HomePage';
import OnboardingPage from './pages/OnboardingPage/OnboardingPage';
import PersonalizationQuizPage from './pages/PersonalizationQuizPage/PersonalizationQuizPage';

const App = () => {
  return (
    <ThemeApplier>
      <HashRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/quiz" element={<PersonalizationQuizPage />} />
          <Route path="/personalization-quiz" element={<Navigate to="/quiz" replace />} />
        </Routes>
      </HashRouter>
    </ThemeApplier>
  );
};

export default App;
