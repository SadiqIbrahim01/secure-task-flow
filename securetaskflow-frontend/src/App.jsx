import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { lazy, Suspense } from 'react';

import ProtectedRoute from './components/guards/ProtectedRoute';
import AdminRoute from './components/guards/AdminRoute';
import Spinner from './components/ui/Spinner';

// Lazy load every page — only downloaded when the user navigates there
const AppLayout           = lazy(() => import('./components/layout/AppLayout'));
const LoginPage           = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage        = lazy(() => import('./pages/auth/RegisterPage'));
const DashboardPage       = lazy(() => import('./pages/dashboard/DashboardPage'));
const OrganizationsPage   = lazy(() => import('./pages/organizations/OrganizationsPage'));
const OrganizationDetailPage = lazy(() => import('./pages/organizations/OrganizationDetailPage'));
const ProjectDetailPage   = lazy(() => import('./pages/projects/ProjectDetailPage'));
const TaskBoardPage       = lazy(() => import('./pages/tasks/TaskBoardPage'));
const AdminUsersPage      = lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminAuditPage      = lazy(() => import('./pages/admin/AdminAuditPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Full-screen loading fallback shown while lazy chunks load
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/organizations" element={<OrganizationsPage />} />
                <Route path="/organizations/:orgId" element={<OrganizationDetailPage />} />
                <Route path="/organizations/:orgId/projects/:projectId"
                       element={<ProjectDetailPage />} />
                <Route path="/projects/:projectId/board" element={<TaskBoardPage />} />

                {/* Admin routes */}
                <Route element={<AdminRoute />}>
                  <Route path="/admin/users" element={<AdminUsersPage />} />
                  <Route path="/admin/audit" element={<AdminAuditPage />} />
                </Route>
              </Route>
            </Route>

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}