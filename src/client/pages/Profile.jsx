import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  AlertCircle, User, Users, BookOpen, Settings2, Github, Twitter, Globe, 
  Bookmark, Mail, Check, X, Sparkles, Eye, Award, TrendingUp, ShieldCheck, Heart,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api.js';
import BlogCard from '../components/BlogCard.jsx';
import BecomeWriterModal from '../components/BecomeWriterModal.jsx';
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

  // Upgrade & Edit Modal states
  const [isBecomeWriterOpen, setIsBecomeWriterOpen] = useState(false);
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
        if (currentUser?._id === u._id) {
          if (
            currentUser?.name !== u.name || 
            currentUser?.username !== u.username || 
            currentUser?.profileImage !== u.profileImage ||
            currentUser?.role !== u.role
          ) {
            dispatch(updateCurrentUser(u));
          }
        }
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
  }, [id, isAuthenticated, currentUser?._id]);

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
  }, [id, activeTab, isAuthenticated, currentUser?._id]);

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
          className="mt-6 inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-6 py-3 rounded-full shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      {/* Profile Card Container */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-[#232734] bg-white dark:bg-[#141720] shadow-sm">
        
        {/* Cover Editorial Banner */}
        <div className="h-44 sm:h-52 bg-slate-900 dark:bg-[#0b0d11] text-slate-200 relative overflow-hidden border-b border-slate-800 dark:border-[#232734]">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:20px_20px]" />
          
          {/* Badge: verified or member */}
          {profileUser.role === 'author' || profileUser.role === 'admin' ? (
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-full text-amber-400 text-xs font-semibold border border-amber-500/30 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Verified {profileUser.role === 'admin' ? 'Admin' : 'Writer'}</span>
            </div>
          ) : (
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-full text-slate-300 text-xs font-medium border border-slate-700/60 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Community Reader</span>
            </div>
          )}
        </div>

        {/* Profile Details Container */}
        <div className="px-6 sm:px-8 pb-8 pt-0 relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 mb-6">
            
            {/* Avatar & Basic Identity */}
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-5 text-center sm:text-left">
              {/* Avatar pulls up over the banner */}
              <div className="relative -mt-16 sm:-mt-20 shrink-0 group">
                <img
                  src={profileUser.profileImage || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(profileUser.username || profileUser.name || 'User')}`}
                  alt={profileUser.name}
                  className="w-28 h-28 sm:w-36 sm:h-36 rounded-full object-cover ring-4 ring-white dark:ring-[#141720] shadow-xl bg-slate-100 dark:bg-[#0b0d11]"
                />
                {profileUser.role !== 'reader' ? (
                  <span className="absolute bottom-1 right-1 w-6 h-6 bg-amber-500 border-2 border-white dark:border-[#141720] rounded-full flex items-center justify-center text-slate-950 text-[10px] font-black shadow-sm" title="Active Writer">
                    ✓
                  </span>
                ) : (
                  <span className="absolute bottom-1 right-1 w-5 h-5 bg-slate-400 border-2 border-white dark:border-[#141720] rounded-full" title="Community Reader" />
                )}
                {isSelf && (
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold"
                    title="Change Avatar"
                  >
                    <Settings2 className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="space-y-1.5 pt-3 sm:pt-4">
                <div className="flex items-center gap-2.5 justify-center sm:justify-start flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-sans">
                    {profileUser.name}
                  </h1>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    {profileUser.role || 'Member'}
                  </span>
                </div>
                
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                  <span className="text-amber-500 font-semibold font-mono">@{profileUser.username || profileUser.email?.split('@')[0]}</span>
                  {profileUser.email && (
                    <>
                      <span className="text-slate-300 dark:text-slate-700">·</span>
                      <span className="text-slate-500 dark:text-slate-400">{profileUser.email}</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Actions (Follow / Edit Profile / Newsletter) */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2 sm:pt-4">
              {!isSelf && (
                <>
                  <button
                    onClick={handleFollow}
                    className={`px-5 py-2.5 text-xs font-bold rounded-full transition-all shadow-sm flex items-center gap-2 ${
                      isFollowing
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-[#141720] dark:hover:bg-[#1a1e29] dark:text-slate-200 dark:border-[#232734]'
                        : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-amber-500/10'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>{isFollowing ? 'Following' : 'Follow Writer'}</span>
                  </button>

                  <button
                    onClick={handleNewsletterToggle}
                    className={`px-5 py-2.5 text-xs font-semibold rounded-full transition-all shadow-sm flex items-center gap-2 border ${
                      isNewsletterSubscribed
                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 dark:bg-[#141720] dark:text-slate-300 dark:border-[#232734]'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>{isNewsletterSubscribed ? 'Subscribed' : 'Newsletter'}</span>
                  </button>
                </>
              )}

              {isSelf && (
                <>
                  {profileUser?.role === 'reader' && (
                    <button
                      onClick={() => setIsBecomeWriterOpen(true)}
                      className="px-5 py-2.5 text-xs font-bold rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 transition-all flex items-center gap-2"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Become a Writer</span>
                    </button>
                  )}
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="px-5 py-2.5 text-xs font-bold rounded-full border border-slate-200 dark:border-[#232734] bg-white hover:bg-slate-50 dark:bg-[#141720] dark:hover:bg-[#1a1e29] text-slate-800 dark:text-slate-200 shadow-sm transition-all flex items-center gap-2"
                  >
                    <Settings2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Edit Profile</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* User Bio */}
          {(!profileUser.isPrivate || isSelf) && (
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 max-w-3xl text-center sm:text-left font-medium">
              {profileUser.bio || 'Welcome to my BlogSphere writing space! I share deep insights, tech trends, and interactive articles.'}
            </p>
          )}

          {/* Social Links Chips */}
          {(!profileUser.isPrivate || isSelf) && profileUser.socialLinks && (profileUser.socialLinks.github || profileUser.socialLinks.twitter || profileUser.socialLinks.website) && (
            <div className="flex flex-wrap gap-3 items-center justify-center sm:justify-start mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60">
              {profileUser.socialLinks.github && (
                <a
                  href={profileUser.socialLinks.github.startsWith('http') ? profileUser.socialLinks.github : `https://${profileUser.socialLinks.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  <Github className="w-3.5 h-3.5 text-slate-800 dark:text-slate-200" />
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
        {(!profileUser.isPrivate || isSelf) && (
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-[#232734] border-t border-slate-100 dark:border-[#232734] bg-slate-50/50 dark:bg-[#141720]/60">
            <div className="p-4 sm:p-5 text-center space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-amber-500">
                <BookOpen className="w-4 h-4" />
                <span className="text-xl font-black">{blogs.length}</span>
              </div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Articles</p>
            </div>

            <div className="p-4 sm:p-5 text-center space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-amber-500">
                <Eye className="w-4 h-4" />
                <span className="text-xl font-black">{totalViews}</span>
              </div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Views</p>
            </div>

            <div className="p-4 sm:p-5 text-center space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-amber-500">
                <Users className="w-4 h-4" />
                <span className="text-xl font-black">{followersCount}</span>
              </div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Followers</p>
            </div>

            <div className="p-4 sm:p-5 text-center space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-amber-500">
                <Mail className="w-4 h-4" />
                <span className="text-xl font-black">{newsletterSubscribersCount}</span>
              </div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Subscribers</p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Navigation & Contents */}
      {!profileUser.isPrivate || isSelf ? (
        <>
          {/* Tabs Navigation */}
          <div className="flex items-center gap-3 border-b border-slate-200 dark:border-[#232734]">
            <button
              onClick={() => setActiveTab('authored')}
              className={`py-3.5 px-6 text-xs font-bold tracking-wide flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'authored'
                  ? 'border-amber-500 text-amber-500 dark:text-amber-400 dark:border-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Published Articles ({blogs.length})</span>
            </button>

            {isSelf && (
              <button
                onClick={() => setActiveTab('bookmarks')}
                className={`py-3.5 px-6 text-xs font-bold tracking-wide flex items-center gap-2 border-b-2 transition-all ${
                  activeTab === 'bookmarks'
                    ? 'border-amber-500 text-amber-500 dark:text-amber-400 dark:border-amber-400'
                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <Bookmark className="w-4 h-4" />
                <span>Saved Bookmarks</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-3.5 px-6 text-xs font-bold tracking-wide flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'analytics'
                  ? 'border-amber-500 text-amber-500 dark:text-amber-400 dark:border-amber-400'
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
            <div className="p-8 rounded-3xl border border-slate-200 dark:border-[#232734] bg-white dark:bg-[#141720] space-y-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Author Reputation & Reach</h3>
                  <p className="text-xs text-slate-400">Lifetime analytics & engagement score for {profileUser.name}</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-6 pt-2">
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#0b0d11] border border-slate-200 dark:border-[#232734] space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Reputation Score</span>
                  <div className="text-2xl font-black text-amber-500">
                    ✨ {profileUser.reputationPoints || 120} pts
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#0b0d11] border border-slate-200 dark:border-[#232734] space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Avg Views / Article</span>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {blogs.length > 0 ? Math.round(totalViews / blogs.length) : 0}
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#0b0d11] border border-slate-200 dark:border-[#232734] space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Engagement Status</span>
                  <div className="text-2xl font-black text-emerald-500">
                    High Activity
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="p-12 text-center rounded-3xl border border-slate-200 dark:border-[#232734] bg-white dark:bg-[#141720] shadow-sm flex flex-col items-center justify-center space-y-4 max-w-2xl mx-auto my-8"
        >
          <div className="p-4 bg-amber-500/10 rounded-full text-amber-500 ring-8 ring-amber-500/5">
            <Lock className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">This Profile is Private</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
            Follow @{profileUser.username || profileUser.email?.split('@')[0]} to view their published articles and stay updated.
          </p>
        </motion.div>
      )}

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#141720] border border-slate-200 dark:border-[#232734] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 my-auto max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-[#232734]">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    <span>Edit Profile Details</span>
                  </h3>
                  <p className="text-xs text-slate-400">Customize your public author persona and links</p>
                </div>
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-[#1a1e29] text-slate-400 transition-colors"
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
                      className="w-full px-3.5 py-2.5 text-xs font-semibold border rounded-2xl bg-slate-50 border-slate-200 dark:bg-[#0b0d11] dark:border-[#232734] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Username Handle</label>
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      placeholder="e.g. patel_deep"
                      className="w-full px-3.5 py-2.5 text-xs font-semibold border rounded-2xl bg-slate-50 border-slate-200 dark:bg-[#0b0d11] dark:border-[#232734] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    id="editIsPrivate"
                    checked={editIsPrivate}
                    onChange={(e) => setEditIsPrivate(e.target.checked)}
                    className="w-4 h-4 text-amber-500 border-slate-350 rounded focus:ring-amber-500 cursor-pointer accent-amber-500"
                  />
                  <label htmlFor="editIsPrivate" className="text-xs font-bold text-slate-500 dark:text-slate-400 cursor-pointer">
                    Private Profile (Hide bio, articles and stats from public view)
                  </label>
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
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-500/10 file:text-amber-600 hover:file:bg-amber-500/20 dark:file:bg-[#0b0d11] dark:file:text-slate-300 cursor-pointer border rounded-2xl p-2 bg-slate-50 border-slate-200 dark:bg-[#0b0d11] dark:border-[#232734]"
                  />
                  
                  {/* Quick Avatar Presets */}
                  <div className="pt-2.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Or Choose an Avatar Style:</span>
                    <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                      {[
                        `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(editUsername || 'Deep')}`,
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(editUsername || 'Patel')}`,
                        `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(editUsername || 'Tech')}`,
                        `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(editUsername || 'Creative')}`,
                        `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(editUsername || 'Writer')}`
                      ].map((presetUrl, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => setEditProfileImage(presetUrl)}
                          className={`w-10 h-10 rounded-full border-2 p-0.5 overflow-hidden transition-all shrink-0 hover:scale-105 ${
                            editProfileImage === presetUrl
                              ? 'border-amber-500 ring-2 ring-amber-500/40'
                              : 'border-slate-200 dark:border-[#232734] hover:border-amber-400'
                          }`}
                        >
                          <img src={presetUrl} alt="preset" className="w-full h-full object-cover rounded-full bg-slate-100 dark:bg-[#0b0d11]" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {editProfileImage && (
                    <div className="mt-2.5 flex items-center gap-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Selected Avatar:</span>
                      <img src={editProfileImage} alt="Preview" className="w-10 h-10 rounded-full object-cover ring-2 ring-amber-500/40 bg-slate-100 dark:bg-[#0b0d11]" />
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
                    className="w-full px-3.5 py-2.5 text-xs font-semibold border rounded-2xl bg-slate-50 border-slate-200 dark:bg-[#0b0d11] dark:border-[#232734] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
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
                      className="w-full pl-9 pr-3.5 py-2 text-xs border rounded-2xl bg-slate-50 border-slate-200 dark:bg-[#0b0d11] dark:border-[#232734] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="relative">
                    <span className="absolute top-2.5 left-3 text-slate-400"><Github className="w-4 h-4" /></span>
                    <input
                      type="text"
                      value={editGithub}
                      onChange={(e) => setEditGithub(e.target.value)}
                      placeholder="GitHub username or URL"
                      className="w-full pl-9 pr-3.5 py-2 text-xs border rounded-2xl bg-slate-50 border-slate-200 dark:bg-[#0b0d11] dark:border-[#232734] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="relative">
                    <span className="absolute top-2.5 left-3 text-slate-400"><Globe className="w-4 h-4" /></span>
                    <input
                      type="text"
                      value={editWebsite}
                      onChange={(e) => setEditWebsite(e.target.value)}
                      placeholder="Personal website URL"
                      className="w-full pl-9 pr-3.5 py-2 text-xs border rounded-2xl bg-slate-50 border-slate-200 dark:bg-[#0b0d11] dark:border-[#232734] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-[#232734]">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-5 py-2.5 border border-slate-200 dark:border-[#232734] rounded-2xl text-slate-500 text-xs font-bold hover:bg-slate-100 dark:hover:bg-[#1a1e29] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl text-xs font-bold shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5"
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

      {/* Become Writer Modal */}
      <BecomeWriterModal
        isOpen={isBecomeWriterOpen}
        onClose={() => setIsBecomeWriterOpen(false)}
        onSuccess={(updated) => {
          setProfileUser(updated);
          setIsBecomeWriterOpen(false);
          showToast('Congratulations! You are now an Author on BlogSphere.', 'success');
        }}
      />
    </div>
  );
}
