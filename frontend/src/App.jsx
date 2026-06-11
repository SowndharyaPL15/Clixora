import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import PublicRoute from './components/PublicRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-[#FAFAF8] flex flex-col relative">
          {/* Aurora Background Blobs */}
          <div className="aurora-blob-1 top-[-200px] left-[-100px]"></div>
          <div className="aurora-blob-2 bottom-[-150px] right-[-100px]"></div>
          <div className="aurora-blob-3 top-[40%] right-[10%]"></div>

          <Navbar />
          <div className="flex-grow relative z-10">
            <Routes>
              {/* Public Auth Routes */}
              <Route element={<PublicRoute />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              </Route>

              {/* Protected Routes */}
              <Route element={<PrivateRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
              </Route>

              {/* Public/Protected Analytics Route */}
              <Route path="/analytics/:shortCode" element={<Analytics />} />

              {/* Redirect root */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
