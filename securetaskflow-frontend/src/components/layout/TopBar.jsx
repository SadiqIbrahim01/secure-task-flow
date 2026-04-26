import { Menu, Bell } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

// Map routes to readable page titles
const pageTitles = {
  '/dashboard': 'Dashboard',
  '/organizations': 'Organizations',
  '/admin/users': 'User Management',
  '/admin/audit': 'Audit Logs',
};

function getPageTitle(pathname) {
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (pathname.includes('/projects/') && pathname.includes('/board'))
    return 'Task Board';
  if (pathname.includes('/organizations/') && pathname.includes('/projects/'))
    return 'Project';
  if (pathname.includes('/organizations/')) return 'Organization';
  return 'SecureTaskFlow';
}

export default function TopBar({ onMenuClick }) {
  const { pathname } = useLocation();
  const user = useAuthStore((s) => s.user);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center 
                       justify-between px-6 flex-shrink-0 sticky top-0 z-10">
      {/* Left — hamburger + page title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-gray-500 hover:text-gray-700 
                     hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">
          {getPageTitle(pathname)}
        </h1>
      </div>

      {/* Right — greeting + notification bell */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500 hidden sm:block">
          Welcome back, {user?.firstName}
        </span>
        <button className="relative text-gray-400 hover:text-gray-600 
                           hover:bg-gray-100 p-2 rounded-lg transition-colors">
          <Bell className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}