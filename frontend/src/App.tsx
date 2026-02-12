import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import AppShell from '@/components/layout/AppShell';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import IncidentListPage from '@/pages/IncidentListPage';
import IncidentDetailPage from '@/pages/IncidentDetailPage';
import ProblemListPage from '@/pages/ProblemListPage';
import ProblemDetailPage from '@/pages/ProblemDetailPage';
import MetricsPage from '@/pages/MetricsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="incidents" element={<IncidentListPage />} />
        <Route path="incidents/:id" element={<IncidentDetailPage />} />
        <Route path="problems" element={<ProblemListPage />} />
        <Route path="problems/:id" element={<ProblemDetailPage />} />
        <Route path="metrics" element={<MetricsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
