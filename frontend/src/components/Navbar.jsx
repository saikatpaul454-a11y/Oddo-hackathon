import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Bell, Shield } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'hr':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur-md">
      {/* Title / Logo context */}
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-bold tracking-tight text-slate-800">
          Dashboard
        </h2>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-4">
        {/* Notifications Mock */}
        <button className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-600"></span>
        </button>

        {/* User profile capsule */}
        {user && (
          <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-700">{user.name}</p>
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getRoleColor(user.role)}`}>
                {user.role.toUpperCase()}
              </span>
            </div>
            
            <div className="relative group">
              <button className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-slate-700 hover:bg-slate-300 transition">
                <User className="h-5 w-5" />
              </button>
              
              {/* Profile actions dropdown on hover */}
              <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-lg border border-slate-100 bg-white py-1 shadow-lg ring-1 ring-black/5 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200">
                <div className="px-4 py-2 border-b border-slate-50">
                  <p className="text-xs text-slate-400">Signed in as</p>
                  <p className="truncate text-xs font-semibold text-slate-700">{user.email}</p>
                </div>
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
