import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ThemeToggle from './components/ThemeToggle';
import PrivateRoute from './components/PrivateRoute';
import PublicRoute from './components/PublicRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Landing from './pages/Landing';

const AppLayout = () => {
  const location = useLocation();
  const hideNavbarRoutes = ['/', '/login', '/signup'];
  const showNavbar = !hideNavbarRoutes.includes(location.pathname);

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-color)] text-[var(--text-color)] flex flex-col relative transition-colors duration-300">
      {/* Aurora Background Blobs */}
      <div className="aurora-blob-1 top-[-200px] left-[-100px]"></div>
      <div className="aurora-blob-2 bottom-[-150px] right-[-100px]"></div>
      <div className="aurora-blob-3 top-[40%] right-[10%]"></div>

      {showNavbar && <Navbar theme={theme} toggleTheme={toggleTheme} />}
      <div className={`flex-grow relative z-10 ${!showNavbar ? 'flex flex-col' : ''}`}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />

          {/* Public Auth Routes */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Route>

          {/* Protected Routes */}
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>

          {/* Public/Protected Analytics Route */}
          <Route path="/analytics/:shortCode" element={<Analytics />} />
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
      
      {/* Floating Theme Toggle */}
      <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </Router>
  );
}

export default App;
