import React from 'react';
import { useLocation } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle = ({ theme, toggleTheme }) => {
  const location = useLocation();

  // Only render floating button on Landing, Login, and Signup pages (where Navbar is hidden)
  const hideNavbarRoutes = ['/', '/login', '/signup'];
  const isNavbarHidden = hideNavbarRoutes.includes(location.pathname);

  if (!isNavbarHidden) return null;

  return (
    <button
      onClick={toggleTheme}
      className="fixed bottom-5 left-5 z-[9999] p-3.5 rounded-full shadow-xl border cursor-pointer transition-all duration-300 bg-white dark:bg-slate-900 border-gray-200/80 dark:border-slate-800 text-gray-700 dark:text-gray-200 hover:scale-110 active:scale-95 flex items-center justify-center hover:shadow-indigo-500/10 dark:hover:shadow-indigo-500/20"
      title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
      aria-label="Toggle Theme"
      id="theme-toggle-btn"
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5 text-indigo-600" />
      ) : (
        <Sun className="w-5 h-5 text-amber-400" />
      )}
    </button>
  );
};

export default ThemeToggle;
