import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Link2, User, Zap, LogIn, UserPlus, Sun, Moon } from 'lucide-react';

const Navbar = ({ theme, toggleTheme }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 pt-4 sticky top-0 z-50">
      <nav className="glass-light max-w-7xl mx-auto rounded-2xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          {/* Brand */}
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:rotate-12 transition-transform duration-300">
              <Zap className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-extrabold tracking-tight">
              <span className="text-gray-900">Clix</span>
              <span className="gradient-text-light">ora</span>
            </span>
          </Link>

          {/* Links & Actions */}
          <div className="flex items-center space-x-5">
            {user && (
              <Link
                to="/dashboard"
                className={`text-sm font-medium transition-all duration-200 flex items-center space-x-1.5 px-3 py-1.5 rounded-lg ${
                  location.pathname === '/dashboard'
                    ? 'text-indigo-600 bg-indigo-50 font-semibold'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Link2 className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
            )}



            {user && (
              <>
                <div className="h-5 w-px bg-[var(--border-color)]"></div>

                <div className="flex items-center space-x-3">
                  <div className="hidden sm:flex items-center space-x-2 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 py-1.5 px-3.5 rounded-full">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white">{user.name?.charAt(0)?.toUpperCase()}</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-700">{user.name}</span>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="text-gray-400 hover:text-rose-500 transition-colors flex items-center space-x-1.5 text-sm font-medium cursor-pointer px-2 py-1.5 rounded-lg hover:bg-rose-50"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
