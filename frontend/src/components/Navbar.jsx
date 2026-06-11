import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Link2, BarChart2, User } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="glass sticky top-0 z-50 border-b border-slate-800/80 px-4 sm:px-6 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <Link to="/dashboard" className="flex items-center space-x-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-md shadow-violet-500/20 group-hover:scale-105 transition-transform">
            <span className="text-white font-extrabold text-lg font-mono">Q</span>
          </div>
          <span className="text-xl font-extrabold text-white tracking-tight">
            Quick<span className="text-violet-500">Cut</span>
          </span>
        </Link>

        {/* Links & Actions */}
        <div className="flex items-center space-x-6">
          <Link
            to="/dashboard"
            className={`text-sm font-medium transition-colors flex items-center space-x-1.5 ${
              location.pathname === '/dashboard' ? 'text-violet-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Link2 className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>

          <div className="h-4 w-px bg-slate-800"></div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 bg-slate-900/50 border border-slate-800/60 py-1 px-3 rounded-full">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-semibold text-slate-300">{user.name}</span>
            </div>

            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-400 transition-colors flex items-center space-x-1.5 text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
