import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './Pages/Home/HomePage';
import OnboardingPage from './Pages/Onboarding/OnboardingPage';
import PersonalizationQuizPage from './Pages/PersonalizationQuiz/PersonalizationQuizPage';

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
