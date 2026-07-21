import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../redux/authSlice.js';
import { Bell, Search, Sun, Moon, PenSquare, LogOut, User, Menu, X, ChevronDown, Check, Brain, Trophy, BookOpen, LayoutDashboard } from 'lucide-react';
import api from '../utils/api.js';
import socket from '../utils/socket.js';

export default function Navbar() {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('theme') === 'dark' ||
    (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const notificationRef = useRef(null);
  const userMenuRef = useRef(null);

  // Sync theme
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Fetch Notifications & Setup Socket
  useEffect(() => {
    if (isAuthenticated && user) {
      socket.connect();
      socket.emit('join_user', user._id);

      api.get('/api/notifications')
        .then((res) => {
          setNotifications(res.data.notifications || []);
          setUnreadCount((res.data.notifications || []).filter(n => !n.isRead).length);
        })
        .catch(console.error);

      socket.on('notification_received', (newNotif) => {
        setNotifications((prev) => [newNotif, ...prev]);
        setUnreadCount((prev) => prev + 1);
      });
    }

    return () => {
      socket.off('notification_received');
      socket.disconnect();
    };
  }, [isAuthenticated, user]);

  // Click Outside hooks
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    setShowUserMenu(false);
    navigate('/');
  };

  const markNotificationRead = async (id) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="sticky top-0 z-50 transition-all border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl w-full max-w-[100vw]">
      <div className="px-4 mx-auto max-w-[95%] xl:max-w-[1550px] sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Brand Logo & Main Nav */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5 group">
              <span className="flex items-center justify-center w-10 h-10 font-black text-white rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                B
              </span>
              <span className="hidden text-xl font-black tracking-tight sm:block bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400">
                BlogSphere
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider pl-6 border-l border-slate-200 dark:border-slate-800">
              <Link 
                to="/" 
                className={`px-3 py-1.5 rounded-full transition-all ${
                  isActive('/') 
                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 font-black' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
              >
                Home
              </Link>
              <Link 
                to="/collections" 
                className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1 ${
                  isActive('/collections') 
                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 font-black' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
              >
                <span>Collections</span>
                <span className="text-[10px]">📚</span>
              </Link>
              <Link 
                to="/communities" 
                className={`px-3 py-1.5 rounded-full transition-all ${
                  isActive('/communities') 
                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 font-black' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
              >
                Communities
              </Link>
              <Link 
                to="/leaderboard" 
                className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1 ${
                  isActive('/leaderboard') 
                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 font-black' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
              >
                <span>Leaderboard</span>
                <span className="text-[10px]">🏆</span>
              </Link>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-md mx-8 my-auto hidden md:block">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles, topics, creators..."
                className="w-full py-2 pl-10 pr-4 text-xs font-semibold transition-all border rounded-full bg-slate-100/80 border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:bg-slate-900/80 dark:border-slate-800 dark:focus:bg-slate-950 text-slate-800 dark:text-slate-100 shadow-inner"
              />
              <Search className="absolute w-4 h-4 text-slate-400 top-2.5 left-3.5" />
            </form>
          </div>

          {/* Controls & User Profile Dropdown */}
          <div className="flex items-center gap-3">
            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 transition-transform hover:scale-105 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800"
              title="Toggle Light/Dark Theme"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {isAuthenticated ? (
              <>
                {/* Write Article Link */}
                <Link
                  to="/editor"
                  className="items-center gap-1.5 px-4 py-2 text-xs font-extrabold text-white transition-all rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-md shadow-indigo-500/20 hidden sm:flex hover:scale-105"
                >
                  <PenSquare className="w-3.5 h-3.5" />
                  <span>Write</span>
                </Link>

                {/* Daily Briefs */}
                <Link
                  to="/daily-briefs"
                  className="items-center gap-1.5 px-4 py-2 text-xs font-extrabold text-slate-700 dark:text-slate-300 transition-all rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 hidden sm:flex"
                >
                  <Brain className="w-3.5 h-3.5 text-indigo-500" />
                  <span>AI Briefs</span>
                </Link>

                {/* Notifications Dropdown */}
                <div className="relative" ref={notificationRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 transition-colors rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-300"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 flex items-center justify-center w-4 h-4 text-[10px] font-black text-white rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-950">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 w-80 mt-2 origin-top-right rounded-3xl shadow-2xl ring-1 ring-black/5 focus:outline-none overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-fade-in">
                      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
                        <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100 uppercase tracking-wider">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 font-extrabold dark:bg-rose-950/40 dark:text-rose-400 border border-rose-500/20">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center text-slate-400 text-xs font-semibold">
                            All quiet here! No new notifications.
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n._id}
                              onClick={() => markNotificationRead(n._id)}
                              className={`px-4 py-3 flex gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${
                                !n.isRead ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                              }`}
                            >
                              <div className="flex-1">
                                <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-snug">{n.message}</p>
                                <span className="text-[10px] text-slate-400 mt-1 block font-bold">
                                  {new Date(n.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              {!n.isRead && (
                                <div className="w-2 h-2 rounded-full bg-indigo-500 self-center shrink-0" />
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Menu Trigger */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 focus:outline-none p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                  >
                    <img
                      src={user?.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                      alt={user?.name}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/30"
                    />
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 w-60 mt-2 origin-top-right rounded-3xl shadow-2xl ring-1 ring-black/5 focus:outline-none overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-fade-in">
                      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                        <p className="text-sm font-black text-slate-900 dark:text-white truncate">{user?.name}</p>
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold capitalize mt-0.5">@{user?.username || 'user'}</p>
                      </div>
                      
                      <div className="p-2 space-y-1">
                        <Link
                          to={`/profile/${user?._id}`}
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                        >
                          <User className="w-4 h-4 text-indigo-500" />
                          <span>My Profile</span>
                        </Link>

                        <Link
                          to="/dashboard"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-purple-500" />
                          <span>Author Dashboard</span>
                        </Link>
                      </div>

                      <div className="p-2 border-t border-slate-100 dark:border-slate-800">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-extrabold text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/login?tab=register"
                  className="px-5 py-2 text-xs font-extrabold text-white rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-md shadow-indigo-500/20 transition-all hover:scale-105"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-900 md:hidden"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-slate-700 dark:text-slate-300" /> : <Menu className="w-5 h-5 text-slate-700 dark:text-slate-300" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 md:hidden px-4 pt-2 pb-6 space-y-3 animate-fade-in">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider"
          >
            Home
          </Link>
          <Link
            to="/collections"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider"
          >
            Collections 📚
          </Link>
          <Link
            to="/communities"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider"
          >
            Communities
          </Link>
          <Link
            to="/leaderboard"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider"
          >
            Leaderboard 🏆
          </Link>

          <form onSubmit={handleSearch} className="relative py-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full py-2 pl-10 pr-4 text-xs font-semibold border rounded-full bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-800 dark:text-slate-100"
            />
            <Search className="absolute w-4 h-4 text-slate-400 top-4 left-3.5" />
          </form>

          {isAuthenticated && (
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Link
                to="/daily-briefs"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 w-full justify-center px-4 py-2.5 text-xs font-extrabold text-slate-700 dark:text-slate-300 rounded-full bg-slate-100 dark:bg-slate-800"
              >
                <Brain className="w-4 h-4 text-indigo-500" />
                <span>AI Briefs</span>
              </Link>
              <Link
                to="/editor"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 w-full justify-center px-4 py-2.5 text-xs font-extrabold text-white rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 shadow-md"
              >
                <PenSquare className="w-4 h-4" />
                <span>Write Article</span>
              </Link>
            </div>
          )}

          {!isAuthenticated && (
            <div className="flex flex-col gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-xs font-extrabold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-2xl"
              >
                Sign In
              </Link>
              <Link
                to="/login?tab=register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-xs font-extrabold text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl shadow-md"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
