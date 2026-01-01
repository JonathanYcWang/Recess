import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainPage from './pages/MainPage';
import BlockedSitesPage from './pages/BlockedSitesPage';
import WorkHoursPage from './pages/WorkHoursPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/settings" element={<Navigate to="/settings/work-hours" replace />} />
        <Route path="/settings/blocked-sites" element={<BlockedSitesPage />} />
        <Route path="/settings/work-hours" element={<WorkHoursPage />} />
      </Routes>
    </Router>
  );
}

export default App;
