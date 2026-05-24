import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage/HomePage';
import QuizPage from './pages/QuizPage/QuizPage';
import SettingsPage from './pages/SettingsPage/SettingsPage';
import WorkPage from './pages/WorkPage/WorkPage';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/work" element={<WorkPage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route
          path="/settings/work-hours"
          element={<Navigate to="/settings" replace state={{ section: 'work-hours' }} />}
        />
        <Route
          path="/settings/blocked-sites"
          element={<Navigate to="/settings" replace state={{ section: 'blocked-sites' }} />}
        />
      </Routes>
    </Router>
  );
};

export default App;
