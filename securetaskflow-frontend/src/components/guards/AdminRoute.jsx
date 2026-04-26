import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

export default function AdminRoute() {
  const { isAuthenticated, isSuperAdmin } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isSuperAdmin()) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}