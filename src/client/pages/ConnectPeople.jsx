import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { updateFollows } from '../redux/authSlice.ts';
import { Search, UserPlus, UserCheck, ShieldCheck, AtSign, Users, Sparkles, Trophy, ArrowRight, CheckCircle, Filter, Loader2, X, RefreshCw, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { getCache, setCache } from '../utils/cacheManager.js';

export default function ConnectPeople() {
  const { user: currentUser, isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState('reputation');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [followingMap, setFollowingMap] = useState({});
  const [followLoading, setFollowLoading] = useState({});

  // Initialize following state map from currentUser
  useEffect(() => {
    if (currentUser && currentUser.following) {
      const map = {};
      currentUser.following.forEach((id) => {
        map[typeof id === 'object' ? id._id : id] = true;
      });
      setFollowingMap(map);
    }
  }, [currentUser]);

  // Fetch users with search and filter
  const fetchUsers = useCallback(async (searchQuery = searchTerm, role = roleFilter, sort = sortBy) => {
    const trimmed = searchQuery.trim();
    const cleanQuery = trimmed.startsWith('@') ? trimmed.slice(1).trim() : trimmed;

    // Avoid querying DB for single-character partial inputs while typing to reduce server load
    if (cleanQuery.length === 1) {
      setIsSearching(false);
      return;
    }

    const cacheKey = `connect_users_${trimmed.toLowerCase()}_${role}_${sort}`;
    const cached = getCache(cacheKey, 5 * 60 * 1000); // 5 min cache

    if (cached) {
      setUsers(cached);
      setLoading(false);
      setIsSearching(false);
    } else {
      setLoading(true);
    }

    try {
      const res = await api.get('/api/users/search/authors', {
        params: {
          search: searchQuery,
          role,
          sortBy: sort
        }
      });

      const list = (res.data.users || []).filter(u => u.role !== 'admin');
      setUsers(list);
      setCache(cacheKey, list);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      if (!cached) {
        showToast('Failed to load user directory.', 'error');
      }
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, [searchTerm, roleFilter, sortBy, showToast]);

  useEffect(() => {
    if (searchTerm.trim().length > 0) {
      setIsSearching(true);
    }
    // 500ms Debounce: Wait until user finishes typing before querying server DB
    const timer = setTimeout(() => {
      fetchUsers(searchTerm, roleFilter, sortBy);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, roleFilter, sortBy, fetchUsers]);

  // Toggle follow/unfollow user
  const handleFollowToggle = async (targetId, targetName) => {
    if (!isAuthenticated) {
      showToast('Please sign in to follow creators.', 'error');
      navigate('/login');
      return;
    }

    setFollowLoading((prev) => ({ ...prev, [targetId]: true }));
    try {
      const res = await api.post(`/api/users/${targetId}/follow`);
      const isFollowingNow = res.data.isFollowing;

      setFollowingMap((prev) => ({
        ...prev,
        [targetId]: isFollowingNow
      }));

      // Update current user following list in Redux
      if (currentUser) {
        const currentFollowing = currentUser.following || [];
        let updatedFollowing = [];
        if (isFollowingNow) {
          updatedFollowing = [...currentFollowing, targetId];
        } else {
          updatedFollowing = currentFollowing.filter((id) => (typeof id === 'object' ? id._id : id) !== targetId);
        }
        dispatch(updateFollows(updatedFollowing));
      }

      // Update followers count locally in users list
      setUsers((prevUsers) =>
        prevUsers.map((u) => {
          if (u._id === targetId) {
            const currentFollowers = u.followers || [];
            const newFollowers = isFollowingNow
              ? [...currentFollowers, currentUser._id]
              : currentFollowers.filter((id) => (typeof id === 'object' ? id._id : id) !== currentUser._id);
            return { ...u, followers: newFollowers };
          }
          return u;
        })
      );

      showToast(isFollowingNow ? `Now following ${targetName}!` : `Unfollowed ${targetName}`, 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Action failed.', 'error');
    } finally {
      setFollowLoading((prev) => ({ ...prev, [targetId]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Banner */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 sm:p-10 text-white shadow-xl shadow-indigo-500/10"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-white/20 rounded-full blur-2xl pointer-events-none"
          />
          
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-white border border-white/20">
              <Users className="w-4 h-4" />
              <span>Connect People Module</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              Discover & Connect by Username
            </h1>
            
            <p className="text-sm sm:text-base text-indigo-100 font-medium leading-relaxed">
              Find creators, thought leaders, and friends by their unique <span className="font-extrabold text-white">@username</span> handle or name. Build your network on BlogSphere.
            </p>
          </div>
        </motion.div>

        {/* Search & Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5"
        >
          
          {/* Main Username Search Input with Animated Glow & Spinner */}
          <div
            className={`relative rounded-2xl p-[2px] transition-all duration-300 ${
              isInputFocused || isSearching
                ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-indigo-500/20'
                : 'bg-transparent'
            }`}
          >
            <div className="relative bg-slate-50 dark:bg-slate-850 rounded-2xl flex items-center">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-indigo-500 font-black text-lg">
                <AnimatePresence mode="wait">
                  {isSearching ? (
                    <motion.div
                      key="searching-icon"
                      initial={{ scale: 0.5, rotate: -90, opacity: 0 }}
                      animate={{ scale: 1, rotate: 0, opacity: 1 }}
                      exit={{ scale: 0.5, rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="relative flex items-center justify-center"
                    >
                      <Loader2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-spin" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="at-icon"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <AtSign className="w-5 h-5 text-indigo-500" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <input
                type="text"
                autoComplete="off"
                value={searchTerm}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by @username, full name, or email..."
                className="w-full pl-12 pr-28 py-3.5 text-sm sm:text-base font-semibold rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 transition-all shadow-inner"
              />

              {/* Right Controls in Search Bar */}
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-2">
                <AnimatePresence>
                  {isSearching && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                    >
                      <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                      Searching
                    </motion.span>
                  )}

                  {searchTerm && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.7 }}
                      onClick={() => setSearchTerm('')}
                      className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                      title="Clear search"
                    >
                      <X className="w-4 h-4" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Filters & Sorting Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            {/* Role Filter Tabs with Animated Active Pill */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 relative">
              {[
                { id: 'all', label: 'All People' },
                { id: 'author', label: 'Authors' },
                { id: 'reader', label: 'Readers' },
              ].map((tab) => {
                const isActive = roleFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setRoleFilter(tab.id)}
                    className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                      isActive
                        ? 'text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeRoleFilter"
                        className="absolute inset-0 bg-indigo-600 rounded-xl shadow-md shadow-indigo-500/20"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Sort Select */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                Sort:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3.5 py-1.5 text-xs font-extrabold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer shadow-sm"
              >
                <option value="reputation" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">Top Reputation</option>
                <option value="followers" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">Most Followed</option>
                <option value="newest" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">Newest Members</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Searching Radar Visualizer Banner */}
        <AnimatePresence>
          {(loading || isSearching) && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              className="relative overflow-hidden bg-gradient-to-r from-indigo-900/10 via-purple-900/10 to-pink-900/10 dark:from-indigo-950/40 dark:via-purple-950/40 dark:to-pink-950/40 border border-indigo-200/60 dark:border-indigo-800/60 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-md shadow-lg"
            >
              <div className="flex items-center gap-4">
                {/* Sonar Radar Pulse */}
                <div className="relative flex items-center justify-center w-14 h-14 shrink-0">
                  <motion.span
                    animate={{ scale: [1, 1.8, 2.2], opacity: [0.6, 0.3, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                    className="absolute w-full h-full rounded-full bg-indigo-500/30"
                  />
                  <motion.span
                    animate={{ scale: [1, 1.4, 1.8], opacity: [0.8, 0.4, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut", delay: 0.4 }}
                    className="absolute w-full h-full rounded-full bg-purple-500/30"
                  />
                  <div className="relative z-10 w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/30">
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                  </div>
                </div>

                {/* Text Details */}
                <div className="text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {searchTerm ? `Searching for "${searchTerm}"` : 'Scanning Creator Directory...'}
                    </h4>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                      Live Radar
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Connecting through handles, skills, and reputation scores
                  </p>
                </div>
              </div>

              {/* Progress Badge */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800 text-xs font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-500" />
                <span>Searching community...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* User Cards Grid with Animated State Transitions */}
        <AnimatePresence mode="wait">
          {loading && users.length === 0 ? (
            <motion.div
              key="skeleton-loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <motion.div
                  key={n}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: n * 0.05 }}
                  className="h-64 bg-slate-200 dark:bg-slate-800/50 rounded-3xl p-6 flex flex-col justify-between overflow-hidden relative"
                >
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 dark:via-slate-700/20 to-transparent" />
                  <div className="flex items-center justify-between">
                    <div className="w-16 h-16 bg-slate-300 dark:bg-slate-700 rounded-2xl animate-pulse" />
                    <div className="w-20 h-8 bg-slate-300 dark:bg-slate-700 rounded-xl animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <div className="w-1/2 h-5 bg-slate-300 dark:bg-slate-700 rounded animate-pulse" />
                    <div className="w-1/3 h-4 bg-slate-300 dark:bg-slate-700 rounded animate-pulse" />
                    <div className="w-full h-8 bg-slate-300 dark:bg-slate-700 rounded animate-pulse" />
                  </div>
                  <div className="w-full h-6 bg-slate-300 dark:bg-slate-700 rounded animate-pulse" />
                </motion.div>
              ))}
            </motion.div>
          ) : users.length === 0 ? (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl space-y-5 shadow-sm"
            >
              <div className="relative flex items-center justify-center w-20 h-20 mx-auto">
                <motion.div
                  animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl"
                />
                <motion.div
                  animate={{ y: [-4, 4, -4] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative z-10 p-4 bg-indigo-50 dark:bg-indigo-950/60 rounded-3xl border border-indigo-100 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400"
                >
                  <Search className="w-10 h-10" />
                </motion.div>
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">No matching users found</h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  We couldn't find anyone matching <span className="font-bold text-indigo-600 dark:text-indigo-400">"{searchTerm}"</span>. Try searching by username (e.g. @john), full name, or switching filter tabs.
                </p>
              </div>

              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/20 active:scale-95"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Clear Search</span>
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="users-grid"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.05
                  }
                }
              }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {users.map((usr) => {
                const handleName = usr.username || usr.name.toLowerCase().replace(/\s+/g, '_');
                const isFollowing = !!followingMap[usr._id];
                const isSelf = currentUser && currentUser._id === usr._id;
                const followersCount = usr.followers?.length || 0;

                return (
                  <motion.div
                    key={usr._id}
                    variants={{
                      hidden: { opacity: 0, y: 20, scale: 0.96 },
                      visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3 } }
                    }}
                    whileHover={{ y: -6, transition: { duration: 0.2 } }}
                    className="group relative bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 hover:shadow-xl hover:border-indigo-500/40 transition-all duration-300 flex flex-col justify-between"
                  >
                    {/* Hover subtle glow aura */}
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-indigo-500/0 via-indigo-500/0 to-indigo-500/5 group-hover:to-indigo-500/10 pointer-events-none transition-colors duration-300" />

                    {/* Card Top Header */}
                    <div className="space-y-4 relative z-10">
                      <div className="flex items-start justify-between gap-3">
                        {/* Avatar */}
                        <Link to={`/profile/${usr._id}`} className="relative shrink-0 group/avatar">
                          <motion.img
                            whileHover={{ scale: 1.08 }}
                            src={usr.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${usr.name}`}
                            alt={usr.name}
                            className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-100 dark:border-slate-800 transition-all group-hover/avatar:border-indigo-500"
                          />
                          {usr.isVerified && (
                            <CheckCircle className="w-5 h-5 text-blue-500 fill-white dark:fill-slate-900 absolute -bottom-1 -right-1" />
                          )}
                        </Link>

                        {/* Follow Button */}
                        {!isSelf ? (
                          <motion.button
                            whileTap={{ scale: 0.92 }}
                            onClick={() => handleFollowToggle(usr._id, usr.name)}
                            disabled={followLoading[usr._id]}
                            className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                              isFollowing
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20 border border-transparent hover:border-rose-200 dark:hover:border-rose-900'
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'
                            } disabled:opacity-50`}
                          >
                            {followLoading[usr._id] ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : isFollowing ? (
                              <>
                                <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Following</span>
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-3.5 h-3.5" />
                                <span>Follow</span>
                              </>
                            )}
                          </motion.button>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-500">
                            You
                          </span>
                        )}
                      </div>

                      {/* Name & Username */}
                      <div>
                        <Link
                          to={`/profile/${usr._id}`}
                          className="text-base font-extrabold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1.5"
                        >
                          <span>{usr.name}</span>
                        </Link>
                        
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                            @{handleName}
                          </span>
                          
                          <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-md uppercase tracking-wider ${
                            usr.role === 'author'
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            {usr.role}
                          </span>
                        </div>
                      </div>

                      {/* Bio */}
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-medium min-h-[2.25rem]">
                        {usr.bio || 'Community member on BlogSphere. Sharing ideas and stories.'}
                      </p>
                    </div>

                    {/* Card Bottom Stats & Link */}
                    <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-4 text-xs">
                        <div>
                          <span className="font-extrabold text-slate-900 dark:text-white">{followersCount}</span>
                          <span className="text-slate-400 text-[10px] ml-1">Followers</span>
                        </div>
                        
                        <div>
                          <span className="font-extrabold text-amber-500 flex items-center gap-0.5">
                            <Trophy className="w-3 h-3 inline" />
                            {usr.reputationPoints || 0}
                          </span>
                          <span className="text-slate-400 text-[10px] ml-1">Pts</span>
                        </div>
                      </div>

                      <Link
                        to={`/profile/${usr._id}`}
                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                      >
                        <span>Profile</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
