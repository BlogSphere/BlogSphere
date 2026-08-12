import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useToast } from '../context/ToastContext.jsx';
import { Link } from 'react-router-dom';
import { Users, Plus, ArrowRight, ArrowLeft, MessageSquare, ShieldAlert, Sparkles, BookOpen, X } from 'lucide-react';
import api from '../utils/api.js';
import BlogCard from '../components/BlogCard.jsx';
import { getCache, setCache, invalidateCache } from '../utils/cacheManager.js';

export default function Communities() {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { showToast } = useToast();
  
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [communityDetails, setCommunityDetails] = useState(null);
  const [commBlogs, setCommBlogs] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCommunities, setTotalCommunities] = useState(0);

  // Form state
  const [createOpen, setCreateOpen] = useState(false);
  const [newCommName, setNewCommName] = useState('');
  const [newCommDesc, setNewCommDesc] = useState('');
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  // Fetch communities list with pagination and cache
  const fetchCommunities = (page = currentPage) => {
    const cacheKey = `communities_p${page}`;
    const cached = getCache(cacheKey, 3 * 60 * 1000);

    if (cached) {
      setCommunities(cached.communities || []);
      setTotalPages(cached.totalPages || 1);
      setTotalCommunities(cached.total || 0);
      setLoading(false);
    } else {
      setLoading(true);
    }

    api.get('/api/communities', { params: { page, limit: 9 } })
      .then((res) => {
        const commList = res.data.communities || [];
        const tPages = res.data.totalPages || 1;
        const total = res.data.total || 0;

        setCommunities(commList);
        setTotalPages(tPages);
        setTotalCommunities(total);
        setLoading(false);

        setCache(cacheKey, { communities: commList, totalPages: tPages, total });
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCommunities(currentPage);
  }, [currentPage, isAuthenticated]);

  // Load selected community details
  useEffect(() => {
    if (selectedCommunity) {
      setLoadingDetails(true);
      api.get(`/api/communities/${selectedCommunity}`)
        .then((res) => {
          setCommunityDetails(res.data.community);
          setCommBlogs(res.data.blogs || []);
          setLoadingDetails(false);
        })
        .catch((err) => {
          console.error(err);
          setLoadingDetails(false);
        });
    } else {
      setCommunityDetails(null);
      setCommBlogs([]);
    }
  }, [selectedCommunity]);

  const handleJoinLeave = async (commId, e) => {
    e.stopPropagation(); // Avoid selecting the card
    if (!isAuthenticated) {
      showToast('Please log in to join communities.', 'warning');
      return;
    }
    try {
      const res = await api.post(`/api/communities/${commId}/join`);
      const { isJoined, membersCount } = res.data;
      
      // Update in main list
      setCommunities((prev) =>
        prev.map((c) => (c._id === commId ? { ...c, isMember: isJoined, membersCount } : c))
      );

      // Update in active details if viewing
      if (communityDetails && communityDetails._id === commId) {
        setCommunityDetails(prev => ({
          ...prev,
          isMember: isJoined,
          membersCount
        }));
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to update community membership.', 'error');
    }
  };

  const handleOpenCreateModal = () => {
    setCreateError('');
    setCreateSuccess('');
    const createdByMeCount = communities.filter(
      (c) => c.creator === user?._id || c.creator?._id === user?._id
    ).length;

    if (createdByMeCount >= 5) {
      showToast('Maximum limit reached: You can create up to 5 communities per account.', 'warning');
      setCreateError('You have reached the maximum limit of 5 communities created per user.');
    }
    setCreateOpen(true);
  };

  const handleCreateCommunity = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');
    
    if (!newCommName.trim()) {
      setCreateError('Community name is required.');
      return;
    }

    const createdByMeCount = communities.filter(
      (c) => c.creator === user?._id || c.creator?._id === user?._id
    ).length;

    if (createdByMeCount >= 5) {
      const limitMsg = 'You have reached the maximum limit of 5 communities created per user.';
      setCreateError(limitMsg);
      showToast(limitMsg, 'error');
      return;
    }

    try {
      const res = await api.post('/api/communities', {
        name: newCommName.trim(),
        description: newCommDesc.trim()
      });
      setCreateSuccess('Community created successfully!');
      showToast('Community channel created successfully!', 'success');
      invalidateCache('communities_');
      setNewCommName('');
      setNewCommDesc('');
      setCreateOpen(false);
      setCurrentPage(1);
      fetchCommunities(1); // Reload list page 1
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to create community.';
      setCreateError(errMsg);
      showToast(errMsg, 'error');
    }
  };

  if (loading) {
    return (
      <div className="max-w-[95%] xl:max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-pulse space-y-8">
        <div className="h-10 bg-slate-200 dark:bg-slate-850 rounded-2xl w-1/4" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-56 bg-slate-200 dark:bg-slate-850 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[95%] xl:max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Detail View of Community */}
      {selectedCommunity ? (
        <div className="space-y-8 animate-fade-in">
          {/* Back Button */}
          <button
            onClick={() => setSelectedCommunity(null)}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Communities</span>
          </button>

          {/* Community Channel Header */}
          {loadingDetails ? (
            <div className="h-40 bg-slate-200 dark:bg-slate-850 rounded-3xl animate-pulse" />
          ) : (
            communityDetails && (
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 sm:p-10 text-white shadow-xl shadow-indigo-500/10 space-y-4">
                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div className="space-y-2 max-w-3xl">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-extrabold uppercase tracking-wider text-white">
                      <Users className="w-3.5 h-3.5" />
                      <span>{communityDetails.membersCount} Members</span>
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">{communityDetails.name}</h1>
                    <p className="text-indigo-100 text-sm font-medium leading-relaxed max-w-2xl">{communityDetails.description || 'Community discussion space for sharing tech ideas and articles.'}</p>
                  </div>

                  <button
                    onClick={(e) => handleJoinLeave(communityDetails._id, e)}
                    className={`px-6 py-3 rounded-2xl text-xs font-extrabold uppercase tracking-wider transition-all shadow-lg active:scale-95 ${
                      communityDetails.isMember
                        ? 'bg-white/20 backdrop-blur-md text-white hover:bg-rose-500 hover:text-white'
                        : 'bg-white text-indigo-600 hover:bg-indigo-50 shadow-white/10'
                    }`}
                  >
                    {communityDetails.isMember ? 'Joined Channel' : 'Join Channel'}
                  </button>
                </div>
              </div>
            )
          )}

          {/* Community Articles List */}
          <div className="space-y-6">
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-500" />
              <span>Channel Articles</span>
            </h2>

            {commBlogs.length === 0 ? (
              <div className="text-center py-16 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                <MessageSquare className="w-10 h-10 text-slate-400 mx-auto opacity-40" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No articles posted in this community yet.</p>
                <p className="text-xs text-slate-400">Write an article and publish it under this community channel to get started!</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {commBlogs.map((blog) => (
                  <BlogCard key={blog._id} blog={blog} />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Hero Header Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 sm:p-10 text-white shadow-xl shadow-indigo-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-extrabold uppercase tracking-wider text-white">
                <Users className="w-4 h-4" />
                <span>Community Channels</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                Collaborative Rooms & Tech Hubs
              </h1>

              <p className="text-sm sm:text-base text-indigo-100 font-medium leading-relaxed">
                Join topic-focused spaces, exchange ideas with developers and authors, and share custom curated content across BlogSphere.
              </p>
            </div>

            {isAuthenticated && (
              <div className="relative z-10 shrink-0">
                <button
                  onClick={handleOpenCreateModal}
                  className="w-full sm:w-auto px-6 py-3.5 bg-white text-indigo-600 hover:bg-indigo-50 rounded-2xl text-xs sm:text-sm font-extrabold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Community</span>
                </button>
              </div>
            )}
          </div>

          {/* Create Community Centered Modal */}
          {createOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setCreateOpen(false)}>
              <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-5" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-500" />
                    <span>Create Community Channel</span>
                  </h3>
                  <button onClick={() => setCreateOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {createError && <p className="text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/20 px-3.5 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/40 font-bold">{createError}</p>}
                {createSuccess && <p className="text-xs text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 px-3.5 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/40 font-bold">{createSuccess}</p>}
                
                <form onSubmit={handleCreateCommunity} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Community Name</label>
                    <input
                      type="text"
                      placeholder="e.g. React & AI Developers"
                      value={newCommName}
                      onChange={(e) => setNewCommName(e.target.value)}
                      className="w-full text-xs sm:text-sm px-4 py-3 border rounded-2xl bg-slate-50 border-slate-200 dark:bg-slate-850 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Description</label>
                    <textarea
                      placeholder="Describe the community topic, rules, or guidelines..."
                      value={newCommDesc}
                      onChange={(e) => setNewCommDesc(e.target.value)}
                      rows={4}
                      className="w-full text-xs sm:text-sm px-4 py-3 border rounded-2xl bg-slate-50 border-slate-200 dark:bg-slate-850 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>

                  <div className="flex gap-3 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setCreateOpen(false)}
                      className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
                    >
                      Save Community
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Communities Grid List */}
          {communities.length === 0 ? (
            <div className="text-center py-20 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 space-y-3">
              <ShieldAlert className="w-12 h-12 text-slate-400 mx-auto opacity-40" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Communities Yet</h3>
              <p className="text-slate-400 text-xs max-w-sm mx-auto">Be the pioneer and build the first community channel!</p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {communities.map((comm) => (
                  <div
                    key={comm._id}
                    onClick={() => setSelectedCommunity(comm._id)}
                    className="p-6 rounded-3xl border border-slate-200/80 hover:border-indigo-500/40 dark:border-slate-800/80 dark:hover:border-indigo-500/40 bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between h-56 cursor-pointer group"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-4">
                        <span className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-extrabold bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 rounded-full border border-indigo-100/50 dark:border-indigo-900/30">
                          <Users className="w-3.5 h-3.5" />
                          <span>{comm.membersCount} members</span>
                        </span>
                      </div>

                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight">
                        {comm.name}
                      </h3>
                      
                      <p className="text-slate-500 dark:text-slate-400 text-xs line-clamp-3 leading-relaxed font-medium">
                        {comm.description || 'Join this collaborative space to share articles and build knowledge.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={(e) => handleJoinLeave(comm._id, e)}
                        className={`px-5 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all shadow-sm ${
                          comm.isMember
                            ? 'bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-rose-950/20'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
                        }`}
                      >
                        {comm.isMember ? 'Joined' : 'Join'}
                      </button>
                      
                      <span className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
                        <span>Enter Channel</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-6">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Showing page <span className="font-bold text-slate-900 dark:text-white">{currentPage}</span> of{' '}
                    <span className="font-bold text-slate-900 dark:text-white">{totalPages}</span> ({totalCommunities} total channels)
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Previous</span>
                    </button>

                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage >= totalPages}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
                    >
                      <span>Next</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
