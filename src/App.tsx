import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './UI/Pages/HomePage/HomePage';
import OnboardingPage from './UI/Pages/OnboardingPage/OnboardingPage';
import PersonalizationQuizPage from './UI/Pages/PersonalizationQuizPage/PersonalizationQuizPage';

const App = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/quiz" element={<PersonalizationQuizPage />} />
        <Route path="/personalization-quiz" element={<Navigate to="/quiz" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
