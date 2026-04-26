
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import ProtectedRoute from './components/guards/ProtectedRoute';
import AdminRoute from './components/guards/AdminRoute';
import AppLayout from './components/layout/AppLayout';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import OrganizationsPage from './pages/organizations/OrganizationsPage';
import OrganizationDetailPage from './pages/organizations/OrganizationDetailPage';
import ProjectDetailPage from './pages/projects/ProjectDetailPage';
import TaskBoardPage from './pages/tasks/TaskBoardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminAuditPage from './pages/admin/AdminAuditPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,    // 2 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes — require authentication */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/organizations" element={<OrganizationsPage />} />
              <Route path="/organizations/:orgId" element={<OrganizationDetailPage />} />
              <Route path="/organizations/:orgId/projects/:projectId"
                     element={<ProjectDetailPage />} />
              <Route path="/projects/:projectId/board" element={<TaskBoardPage />} />

              {/* Admin routes — require SUPER_ADMIN */}
              <Route element={<AdminRoute />}>
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/admin/audit" element={<AdminAuditPage />} />
              </Route>
            </Route>
          </Route>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}