import { NavLink, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  LayoutDashboard,
  Building2,
  FolderKanban,
  Users,
  ScrollText,
  X,
  LogOut,
} from 'lucide-react';
import { clsx } from 'clsx';
import useAuthStore from '../../store/authStore';
import { logout } from '../../api/auth';

const navItems = [
  {
    label: 'Dashboard',
    to: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Organizations',
    to: '/organizations',
    icon: Building2,
  },
];

const adminItems = [
  {
    label: 'Users',
    to: '/admin/users',
    icon: Users,
  },
  {
    label: 'Audit Logs',
    to: '/admin/audit',
    icon: ScrollText,
  },
];

function NavItem({ to, icon: Icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
          isActive
            ? 'bg-primary-600 text-white'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        )
      }
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      {label}
    </NavLink>
  );
}

export default function Sidebar({ open, onClose }) {
  const navigate = useNavigate();
  const { user, isSuperAdmin, logout: logoutStore } = useAuthStore();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Token may already be expired — logout locally regardless
    } finally {
      logoutStore();
      navigate('/login', { replace: true });
    }
  };

  return (
    <aside
      className={clsx(
        'fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200',
        'flex flex-col transition-transform duration-300 ease-in-out',
        'lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 
                      border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center 
                          justify-center">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-gray-900 text-sm">SecureTaskFlow</span>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="lg:hidden text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map((item) => (
          <NavItem key={item.to} {...item} onClick={onClose} />
        ))}

        {/* Admin section — only visible to SUPER_ADMIN */}
        {isSuperAdmin() && (
          <>
            <div className="pt-4 pb-2">
              <p className="text-xs font-semibold text-gray-400 uppercase 
                            tracking-wider px-3">
                Admin
              </p>
            </div>
            {adminItems.map((item) => (
              <NavItem key={item.to} {...item} onClick={onClose} />
            ))}
          </>
        )}
      </nav>

      {/* User footer */}
      <div className="p-4 border-t border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-3 mb-3">
          {/* Avatar */}
          <div className="h-9 w-9 rounded-full bg-primary-100 flex items-center 
                          justify-center flex-shrink-0">
            <span className="text-primary-700 font-semibold text-sm">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>

        {/* Role badge */}
        {isSuperAdmin() && (
          <div className="mb-3">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs 
                             font-medium bg-purple-100 text-purple-700">
              SUPER_ADMIN
            </span>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm 
                     text-gray-600 hover:text-red-600 hover:bg-red-50 
                     rounded-lg transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}