import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  AlertCircle, User, Users, BookOpen, Settings2, Github, Twitter, Globe, 
  Bookmark, Mail, Check, X, Sparkles, Eye, Award, TrendingUp, ShieldCheck, Heart 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api.js';
import BlogCard from '../components/BlogCard.jsx';
import { updateCurrentUser } from '../redux/authSlice.js';
import { useToast } from '../context/ToastContext.jsx';

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user: currentUser, isAuthenticated } = useSelector((state) => state.auth);
  const { showToast } = useToast();

  const [profileUser, setProfileUser] = useState(null);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Followers & Newsletter states
  const [followersCount, setFollowersCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isNewsletterSubscribed, setIsNewsletterSubscribed] = useState(false);
  const [newsletterSubscribersCount, setNewsletterSubscribersCount] = useState(0);

  // Tabs & Bookmarks states
  const [activeTab, setActiveTab] = useState('authored'); // 'authored', 'bookmarks', 'analytics'
  const [bookmarks, setBookmarks] = useState([]);
  const [loadingBookmarks, setLoadingBookmarks] = useState(false);

  // Edit Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editProfileImage, setEditProfileImage] = useState('');
  const [editTwitter, setEditTwitter] = useState('');
  const [editGithub, setEditGithub] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editIsPrivate, setEditIsPrivate] = useState(false);
  const [editUsername, setEditUsername] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');

    api.get(`/api/users/${id}/profile`)
      .then((res) => {
        const u = res.data.user;
        setProfileUser(u);
        setBlogs(res.data.blogs || []);
        setFollowersCount(u.followers?.length || 0);
        setIsFollowing(isAuthenticated && u.followers?.includes(currentUser?._id));
        
        setIsNewsletterSubscribed(isAuthenticated && u.newsletterSubscribers?.includes(currentUser?._id));
        setNewsletterSubscribersCount(u.newsletterSubscribers?.length || 0);

        // Populate edit form defaults
        setEditName(u.name || '');
        setEditBio(u.bio || '');
        setEditProfileImage(u.profileImage || '');
        setEditTwitter(u.socialLinks?.twitter || '');
        setEditGithub(u.socialLinks?.github || '');
        setEditWebsite(u.socialLinks?.website || '');
        setEditIsPrivate(u.isPrivate || false);
        setEditUsername(u.username || '');

        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'Profile not found.');
        setLoading(false);
      });
  }, [id, isAuthenticated, currentUser]);

  useEffect(() => {
    if (isAuthenticated && currentUser?._id === id && activeTab === 'bookmarks') {
      setLoadingBookmarks(true);
      api.get('/api/users/bookmarks')
        .then((res) => {
          setBookmarks(res.data.bookmarks || []);
          setLoadingBookmarks(false);
        })
        .catch((err) => {
          console.error(err);
          setLoadingBookmarks(false);
        });
    }
  }, [id, activeTab, isAuthenticated, currentUser]);

  const handleFollow = async () => {
    if (!isAuthenticated) return navigate('/login');
    try {
      const res = await api.post(`/api/users/${profileUser._id}/follow`);
      setFollowersCount(res.data.followersCount);
      setIsFollowing(res.data.isFollowing);
      showToast(res.data.isFollowing ? `You are now following ${profileUser.name}` : `Unfollowed ${profileUser.name}`, 'info');
    } catch (e) {
      console.error(e);
      showToast('Failed to update follow status.', 'error');
    }
  };

  const handleNewsletterToggle = async () => {
    if (!isAuthenticated) return navigate('/login');
    try {
      const res = await api.post(`/api/users/newsletter/${profileUser._id}`);
      setIsNewsletterSubscribed(res.data.isSubscribed);
      setNewsletterSubscribersCount(res.data.subscribersCount);
      showToast(res.data.isSubscribed ? 'Subscribed to author newsletter!' : 'Unsubscribed from newsletter', 'info');
    } catch (e) {
      console.error(e);
      showToast('Failed to update newsletter subscription.', 'error');
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put('/api/users/profile', {
        name: editName,
        bio: editBio,
        profileImage: editProfileImage,
        isPrivate: editIsPrivate,
        username: editUsername,
        socialLinks: {
          twitter: editTwitter,
          github: editGithub,
          website: editWebsite
        }
      });
      setProfileUser(res.data.user);
      dispatch(updateCurrentUser(res.data.user));
      setIsEditModalOpen(false);
      showToast('Profile updated successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.error || 'Failed to update profile.', 'error');
    }
  };

  // Compute metrics
  const totalViews = blogs.reduce((acc, b) => acc + (b.views || 0), 0);
  const isSelf = isAuthenticated && currentUser?._id === profileUser?._id;

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 animate-pulse space-y-8">
        <div className="h-48 rounded-3xl bg-slate-200 dark:bg-slate-800/60" />
        <div className="flex flex-col sm:flex-row items-center gap-6 -mt-16 px-6">
          <div className="w-28 h-28 rounded-full bg-slate-300 dark:bg-slate-700 ring-4 ring-white dark:ring-slate-900" />
          <div className="space-y-3 flex-1 text-center sm:text-left">
            <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg mx-auto sm:mx-0" />
            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded mx-auto sm:mx-0" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800/50 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="max-w-md mx-auto text-center py-24 px-4">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-black text-slate-900 dark:text-white">Profile Not Found</h3>
        <p className="text-slate-400 text-sm mt-2">{error || 'This user profile does not exist or has been removed.'}</p>
        <button 
          onClick={() => navigate('/')} 
          className="mt-6 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold px-6 py-3 rounded-full shadow-lg shadow-indigo-500/20 transition-all hover:scale-105"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      {/* Profile Card Container */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/80 backdrop-blur-xl shadow-xl shadow-indigo-500/5">
        
        {/* Cover Aura Banner */}
        <div className="h-48 sm:h-60 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent opacity-60" />
          <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full text-white/90 text-xs font-bold border border-white/10">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Verified Creator</span>
          </div>
        </div>

        {/* Profile Details Container */}
        <div className="px-6 sm:px-8 pb-8 pt-0 relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6 -mt-16 sm:-mt-20 mb-6">
            
            {/* Avatar & Basic Identity */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
              <div className="relative">
                <img
                  src={profileUser.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                  alt={profileUser.name}
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover ring-4 ring-white dark:ring-slate-900 shadow-2xl bg-white dark:bg-slate-900"
                />
                <span className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" title="Active Author" />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">{profileUser.name}</h1>
                  {profileUser.badge && (
                    <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 border border-indigo-500/20">
                      ✨ {profileUser.badge}
                    </span>
                  )}
                </div>
                
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  @{profileUser.username || profileUser.email?.split('@')[0]}
                  <span className="mx-2">•</span>
                  <span className="capitalize text-indigo-600 dark:text-indigo-400 font-extrabold">{profileUser.role || 'Member'}</span>
                </p>
              </div>
            </div>

            {/* Actions (Follow / Edit Profile / Newsletter) */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              {!isSelf && (
                <>
                  <button
                    onClick={handleFollow}
                    className={`px-6 py-2.5 text-xs font-extrabold rounded-full transition-all shadow-md flex items-center gap-2 ${
                      isFollowing
                        ? 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200'
                        : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-indigo-500/25'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>{isFollowing ? 'Following' : 'Follow Author'}</span>
                  </button>

                  <button
                    onClick={handleNewsletterToggle}
                    className={`px-5 py-2.5 text-xs font-extrabold rounded-full transition-all shadow-md flex items-center gap-2 ${
                      isNewsletterSubscribed
                        ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-500/20'
                        : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>{isNewsletterSubscribed ? 'Subscribed' : 'Newsletter'}</span>
                  </button>
                </>
              )}

              {isSelf && (
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-6 py-2.5 text-xs font-extrabold rounded-full border border-slate-200 dark:border-slate-700/80 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-800 dark:text-white shadow-sm transition-all flex items-center gap-2 hover:scale-105"
                >
                  <Settings2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>
          </div>

          {/* User Bio */}
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 max-w-3xl text-center sm:text-left font-medium">
            {profileUser.bio || 'Welcome to my BlogSphere writing space! I share deep insights, tech trends, and interactive articles.'}
          </p>

          {/* Social Links Chips */}
          {profileUser.socialLinks && (profileUser.socialLinks.github || profileUser.socialLinks.twitter || profileUser.socialLinks.website) && (
            <div className="flex flex-wrap gap-3 items-center justify-center sm:justify-start mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60">
              {profileUser.socialLinks.github && (
                <a
                  href={profileUser.socialLinks.github.startsWith('http') ? profileUser.socialLinks.github : `https://${profileUser.socialLinks.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  <Github className="w-3.5 h-3.5 text-indigo-500" />
                  <span>GitHub</span>
                </a>
              )}
              {profileUser.socialLinks.twitter && (
                <a
                  href={profileUser.socialLinks.twitter.startsWith('http') ? profileUser.socialLinks.twitter : `https://${profileUser.socialLinks.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  <Twitter className="w-3.5 h-3.5 text-sky-500" />
                  <span>Twitter</span>
                </a>
              )}
              {profileUser.socialLinks.website && (
                <a
                  href={profileUser.socialLinks.website.startsWith('http') ? profileUser.socialLinks.website : `https://${profileUser.socialLinks.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  <Globe className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Website</span>
                </a>
              )}
            </div>
          )}
        </div>

        {/* Stats Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800/80 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="p-4 sm:p-5 text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-indigo-600 dark:text-indigo-400">
              <BookOpen className="w-4 h-4" />
              <span className="text-xl font-black">{blogs.length}</span>
            </div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Articles</p>
          </div>

          <div className="p-4 sm:p-5 text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-violet-600 dark:text-violet-400">
              <Eye className="w-4 h-4" />
              <span className="text-xl font-black">{totalViews}</span>
            </div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Views</p>
          </div>

          <div className="p-4 sm:p-5 text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <Users className="w-4 h-4" />
              <span className="text-xl font-black">{followersCount}</span>
            </div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Followers</p>
          </div>

          <div className="p-4 sm:p-5 text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-rose-600 dark:text-rose-400">
              <Mail className="w-4 h-4" />
              <span className="text-xl font-black">{newsletterSubscribersCount}</span>
            </div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Subscribers</p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-3 border-b border-slate-200/80 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('authored')}
          className={`py-3.5 px-6 text-xs font-black tracking-wide flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'authored'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Published Articles ({blogs.length})</span>
        </button>

        {isSelf && (
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`py-3.5 px-6 text-xs font-black tracking-wide flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'bookmarks'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Saved Bookmarks</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('analytics')}
          className={`py-3.5 px-6 text-xs font-black tracking-wide flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'analytics'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Author Impact</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'authored' && (
        <div className="space-y-6">
          {blogs.length === 0 ? (
            <div className="text-center py-16 border border-slate-200/80 dark:border-slate-800 rounded-3xl bg-white/60 dark:bg-slate-900/60 p-8 space-y-3">
              <BookOpen className="w-10 h-10 mx-auto text-slate-400 opacity-60" />
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">No Published Articles Yet</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">This creator has not published any public articles. Check back later!</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogs.map((blog) => (
                <BlogCard key={blog._id} blog={blog} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'bookmarks' && (
        <div className="space-y-6">
          {loadingBookmarks ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl h-80" />
              ))}
            </div>
          ) : bookmarks.length === 0 ? (
            <div className="text-center py-16 border border-slate-200/80 dark:border-slate-800 rounded-3xl bg-white/60 dark:bg-slate-900/60 p-8 space-y-3">
              <Bookmark className="w-10 h-10 mx-auto text-slate-400 opacity-60" />
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">No Saved Bookmarks</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">Click the bookmark icon on any article to save it for reading later.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookmarks.map((blog) => (
                <BlogCard key={blog._id} blog={blog} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Author Reputation & Reach</h3>
              <p className="text-xs text-slate-400">Lifetime analytics & engagement score for {profileUser.name}</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 pt-2">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Reputation Score</span>
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                ✨ {profileUser.reputationPoints || 120} pts
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Avg Views / Article</span>
              <div className="text-2xl font-black text-violet-600 dark:text-violet-400">
                {blogs.length > 0 ? Math.round(totalViews / blogs.length) : 0}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Engagement Status</span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                High Activity
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 my-auto max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-500" />
                    <span>Edit Profile Details</span>
                  </h3>
                  <p className="text-xs text-slate-400">Customize your public author persona and links</p>
                </div>
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs font-semibold border rounded-2xl bg-slate-50 border-slate-200 dark:bg-slate-800/80 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Username Handle</label>
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      placeholder="e.g. patel_deep"
                      className="w-full px-3.5 py-2.5 text-xs font-semibold border rounded-2xl bg-slate-50 border-slate-200 dark:bg-slate-800/80 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Profile Picture / Avatar</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setEditProfileImage(reader.result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 dark:file:bg-slate-800 dark:file:text-slate-300 cursor-pointer border rounded-2xl p-2 bg-slate-50 border-slate-200 dark:bg-slate-800/80 dark:border-slate-700"
                  />
                  {editProfileImage && (
                    <div className="mt-2.5 flex items-center gap-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Avatar Preview:</span>
                      <img src={editProfileImage} alt="Preview" className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/20" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Bio Description</label>
                  <textarea
                    rows={3}
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="Write a brief intro about yourself and your writing subjects..."
                    className="w-full px-3.5 py-2.5 text-xs font-semibold border rounded-2xl bg-slate-50 border-slate-200 dark:bg-slate-800/80 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

                <div className="space-y-3 pt-1">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Social Channels</label>
                  
                  <div className="relative">
                    <span className="absolute top-2.5 left-3 text-slate-400"><Twitter className="w-4 h-4" /></span>
                    <input
                      type="text"
                      value={editTwitter}
                      onChange={(e) => setEditTwitter(e.target.value)}
                      placeholder="Twitter handle or URL"
                      className="w-full pl-9 pr-3.5 py-2 text-xs border rounded-2xl bg-slate-50 border-slate-200 dark:bg-slate-800/80 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="relative">
                    <span className="absolute top-2.5 left-3 text-slate-400"><Github className="w-4 h-4" /></span>
                    <input
                      type="text"
                      value={editGithub}
                      onChange={(e) => setEditGithub(e.target.value)}
                      placeholder="GitHub username or URL"
                      className="w-full pl-9 pr-3.5 py-2 text-xs border rounded-2xl bg-slate-50 border-slate-200 dark:bg-slate-800/80 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="relative">
                    <span className="absolute top-2.5 left-3 text-slate-400"><Globe className="w-4 h-4" /></span>
                    <input
                      type="text"
                      value={editWebsite}
                      onChange={(e) => setEditWebsite(e.target.value)}
                      placeholder="Personal website URL"
                      className="w-full pl-9 pr-3.5 py-2 text-xs border rounded-2xl bg-slate-50 border-slate-200 dark:bg-slate-800/80 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-5 py-2.5 border rounded-2xl text-slate-500 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-2xl text-xs font-extrabold shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
