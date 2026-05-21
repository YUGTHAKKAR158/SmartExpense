// ═══════════════════════════════════════════════
// src/layouts/MainLayout.jsx
//
// The shell that wraps every authenticated page.
// Contains the sidebar navigation and top bar.
// Pages are rendered inside this layout via <Outlet />
// ═══════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useInvites } from '../context/InviteContext';

// Navigation items — easy to add more later
const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard',  icon: '📊' },
  { path: '/expenses',  label: 'Expenses',   icon: '💸' },
  { path: '/budgets',   label: 'Budgets',    icon: '🎯' },
  { path: '/insights',  label: 'Insights',   icon: '💡' },
  { path: '/predict',   label: 'Predictions',icon: '🔮' },
  { path: '/groups',    label: 'Bill Split', icon: '👥' },
  { path: '/reports',   label: 'Reports',    icon: '📄' },
  { path: '/invites',   label: 'Invites',    icon: '📨' }
];

const MainLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const { inviteCount } = useInvites();

  // Mobile sidebar open/close state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* ─────────────────────────────────────────
          SIDEBAR
          ───────────────────────────────────────── */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg
        transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center px-6 py-5 border-b border-gray-200">
          <span className="text-2xl mr-2">💰</span>
          <span className="text-lg font-bold text-gray-900">SmartExpense</span>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center px-3 py-2.5 rounded-lg text-sm font-medium
                transition-colors duration-150
                ${isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
               }
             `}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              <span className="flex-1">{item.label}</span>

              {/* Badge — only shows on Invites when count > 0 */}
              {item.path === '/invites' && inviteCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold
                  px-2 py-0.5 rounded-full min-w-[20px] text-center leading-5">
                  {inviteCount > 9 ? '9+' : inviteCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User info + logout */}
        <div className="px-4 py-4 border-t border-gray-200">
          <div className="flex items-center mb-3">
            {/* Avatar circle with first letter of name */}
            <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold text-sm mr-3">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 text-sm text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
          >
            🚪 Sign out
          </button>
        </div>
      </aside>

      {/* Mobile overlay — clicking closes sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─────────────────────────────────────────
          MAIN CONTENT AREA
          ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          {/* Mobile hamburger button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
          >
            ☰
          </button>

          <div className="flex items-center ml-auto">
            <span className="text-sm text-gray-500">
              Welcome back, <span className="font-medium text-gray-900">{user?.name}</span>
            </span>
          </div>
        </header>

        {/* Page content — React Router renders the matched
            child route here via <Outlet /> */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;