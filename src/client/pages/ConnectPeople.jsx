import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { updateFollows } from '../redux/authSlice.ts';
import { Search, UserPlus, UserCheck, ShieldCheck, AtSign, Users, Sparkles, Trophy, ArrowRight, CheckCircle, Filter } from 'lucide-react';
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
    const cacheKey = `connect_users_${searchQuery}_${role}_${sort}`;
    const cached = getCache(cacheKey, 3 * 60 * 1000); // 3 min cache

    if (cached) {
      setUsers(cached);
      setLoading(false);
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
    }
  }, [searchTerm, roleFilter, sortBy, showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(searchTerm, roleFilter, sortBy);
    }, 250);
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
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 sm:p-10 text-white shadow-xl shadow-indigo-500/10">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-white">
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
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
          
          {/* Main Username Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-indigo-500 font-black text-lg">
              <AtSign className="w-5 h-5 text-indigo-500" />
            </div>
            
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by @username, full name, or email..."
              className="w-full pl-12 pr-12 py-3.5 text-sm sm:text-base font-semibold rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-inner"
            />

            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filters & Sorting Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            {/* Role Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: 'all', label: 'All People' },
                { id: 'author', label: 'Authors' },
                { id: 'reader', label: 'Readers' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setRoleFilter(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    roleFilter === tab.id
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
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
                className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="reputation">Top Reputation</option>
                <option value="followers">Most Followed</option>
                <option value="newest">Newest Members</option>
              </select>
            </div>
          </div>
        </div>

        {/* User Cards Grid */}
        {loading && users.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-64 bg-slate-200 dark:bg-slate-800/50 rounded-3xl" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl space-y-4">
            <Users className="w-12 h-12 text-slate-400 mx-auto opacity-30" />
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No matching users found</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              We couldn't find anyone matching <span className="font-bold text-indigo-500">"{searchTerm}"</span>. Try searching for a different username or full name.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((usr) => {
              const handleName = usr.username || usr.name.toLowerCase().replace(/\s+/g, '_');
              const isFollowing = !!followingMap[usr._id];
              const isSelf = currentUser && currentUser._id === usr._id;
              const followersCount = usr.followers?.length || 0;

              return (
                <div
                  key={usr._id}
                  className="group relative bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 hover:shadow-xl hover:border-indigo-500/30 transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Card Top Header */}
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      {/* Avatar */}
                      <Link to={`/profile/${usr._id}`} className="relative shrink-0">
                        <img
                          src={usr.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${usr.name}`}
                          alt={usr.name}
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-100 dark:border-slate-800 group-hover:scale-105 transition-transform"
                        />
                        {usr.isVerified && (
                          <CheckCircle className="w-5 h-5 text-blue-500 fill-white dark:fill-slate-900 absolute -bottom-1 -right-1" />
                        )}
                      </Link>

                      {/* Follow Button */}
                      {!isSelf ? (
                        <button
                          onClick={() => handleFollowToggle(usr._id, usr.name)}
                          disabled={followLoading[usr._id]}
                          className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                            isFollowing
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20'
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'
                          } disabled:opacity-50`}
                        >
                          {isFollowing ? (
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
                        </button>
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
                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
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
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
