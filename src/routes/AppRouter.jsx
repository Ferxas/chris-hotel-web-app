import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SidebarLayout from '../layouts/SidebarLayout';

import Dashboard from '../pages/Dashboard';
// páginas futuras
import RoomsPage from '../pages/RoomsPage';
import ReportsPage from '../pages/ReportsPage';
import CleaningPage from '../pages/CleaningPage';
import MaintenancePage from '../pages/MaintenancePage';
import MaintenanceLogsPage from '../pages/MaintenanceLogsPage';
import DevicesPage from '../pages/DevicesPage';

export default function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route element={<SidebarLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/rooms" element={<RoomsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/cleaning" element={<CleaningPage />} />
          <Route path="/maintenance" element={<MaintenancePage />} />
          <Route path="/maintenance-history" element={<MaintenanceLogsPage />} />
          <Route path="/devices" element={<DevicesPage />} />

        </Route>
      </Routes>
    </Router>
  );
}