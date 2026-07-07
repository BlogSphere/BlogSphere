import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { authSuccess, logoutUser } from './redux/authSlice';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Auth from './pages/Auth';
import BlogDetail from './pages/BlogDetail';
import Editor from './pages/Editor';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import AdCenter from './pages/AdCenter';
import api from './utils/api';

export default function App() {
  const dispatch = useDispatch();

  // Validate session on startup
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/api/auth/me')
        .then((res) => {
          dispatch(authSuccess({ token, user: res.data.user }));
        })
        .catch((err) => {
          console.error('Session restore failed:', err);
          dispatch(logoutUser());
        });
    }
  }, [dispatch]);

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300">
        {/* Navigation Bar */}
        <Navbar />

        {/* Core Layout Routes */}
        <div className="flex-1 w-full">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/register" element={<Auth />} />
            <Route path="/blog/:slug" element={<BlogDetail />} />
            <Route path="/editor" element={<Editor />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/system-admin-sphere" element={<Admin />} />
            <Route path="/adsense" element={<AdCenter />} />
            <Route path="/profile/:id" element={<Profile />} />
          </Routes>
        </div>

        {/* Footer */}
        <footer className="py-8 border-t border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950 text-center text-xs text-slate-400">
          <div className="max-w-7xl mx-auto px-4">
            <p>© {new Date().getFullYear()} BlogSphere — Smart Community Blog Platform. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}
