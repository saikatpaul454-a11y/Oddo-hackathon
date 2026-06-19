import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  User,
  Users,
  CalendarDays,
  FileCheck,
  CreditCard,
  Activity,
  LogOut,
  Sparkles
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();

  const getLinks = () => {
    const common = [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/profile', label: 'Profile', icon: User },
    ];

    if (user?.role === 'employee') {
      return [
        ...common,
        { to: '/attendance', label: 'My Attendance', icon: CalendarDays },
        { to: '/leaves', label: 'My Leaves', icon: FileCheck },
      ];
    }

    if (user?.role === 'hr') {
      return [
        ...common,
        { to: '/manage-employees', label: 'Manage Employees', icon: Users },
        { to: '/attendance-records', label: 'Attendance Management', icon: CalendarDays },
        { to: '/leave-requests', label: 'Leave Requests', icon: FileCheck },
        { to: '/payroll', label: 'Payroll & Salary', icon: CreditCard },
      ];
    }

    if (user?.role === 'admin') {
      return [
        ...common,
        { to: '/manage-employees', label: 'Manage Employees', icon: Users },
        { to: '/attendance-records', label: 'Attendance Management', icon: CalendarDays },
        { to: '/leave-requests', label: 'Leave Requests', icon: FileCheck },
        { to: '/payroll', label: 'Payroll & Salary', icon: CreditCard },
        { to: '/activity-logs', label: 'System Logs', icon: Activity },
      ];
    }

    return common;
  };

  const navLinks = getLinks();

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-slate-200 bg-slate-900 text-slate-400">
      {/* Branding Header */}
      <div className="flex h-16 items-center gap-2 border-b border-slate-800 px-6">
        <Sparkles className="h-6 w-6 text-indigo-400" />
        <span className="text-lg font-bold text-white tracking-tight">
          EMS Portal
        </span>
      </div>

      {/* Nav Link List */}
      <nav className="flex-1 space-y-1.5 px-4 py-6">
        {navLinks.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition duration-200 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`
              }
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {link.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / Logout Button */}
      <div className="border-t border-slate-800 p-4">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-red-400 transition duration-200"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
