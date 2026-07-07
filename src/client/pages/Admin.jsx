import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Shield, Users, BookOpen, AlertTriangle, ShieldCheck, Trash2, Edit3, ArrowLeft, X, Sparkles } from 'lucide-react';
import api from '../utils/api.js';

export default function Admin() {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('users'); // 'users', 'blogs', or 'restricted'
  const [usersList, setUsersList] = useState([]);
  const [blogsList, setBlogsList] = useState([]);
  const [restrictedWords, setRestrictedWords] = useState([]);
  const [newRestrictedWord, setNewRestrictedWord] = useState('');
  const [wordAdding, setWordAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [triggeringPost, setTriggeringPost] = useState(false);

  const handleTriggerAutoPost = async () => {
    setTriggeringPost(true);
    try {
      const res = await api.post('/api/blogs/trigger-trending-post');
      alert(`Successfully published AI Trending Article: "${res.data.blog.title}"`);
      // Reload blog list
      const blogsRes = await api.get('/api/blogs?status=all');
      setBlogsList(blogsRes.data.blogs || []);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to trigger automated trending post.');
    } finally {
      setTriggeringPost(false);
    }
  };

  // Redirect if not admin
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/');
    }
  }, [isAuthenticated, user, navigate]);

  // Load Admin Data
  useEffect(() => {
    setLoading(true);
    setError('');

    Promise.all([
      api.get('/api/users'),
      api.get('/api/blogs?status=all'),
      api.get('/api/restricted-words')
    ])
      .then(([usersRes, blogsRes, wordsRes]) => {
        setUsersList(usersRes.data.users || []);
        setBlogsList(blogsRes.data.blogs || []);
        setRestrictedWords(wordsRes.data.words || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'Failed to fetch administration data.');
        setLoading(false);
      });
  }, []);

  const handleAddWord = async (e) => {
    e.preventDefault();
    if (!newRestrictedWord.trim()) return;
    setWordAdding(true);
    try {
      const res = await api.post('/api/restricted-words', { word: newRestrictedWord.trim() });
      setRestrictedWords([...restrictedWords, res.data.word].sort((a, b) => a.word.localeCompare(b.word)));
      setNewRestrictedWord('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add restricted word.');
    } finally {
      setWordAdding(false);
    }
  };

  const handleDeleteWord = async (wordId) => {
    if (window.confirm('Are you sure you want to remove this word from restrictions?')) {
      try {
        await api.delete(`/api/restricted-words/${wordId}`);
        setRestrictedWords(restrictedWords.filter(w => w._id !== wordId));
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to delete restricted word.');
      }
    }
  };

  // User Administration Updates
  const handleUpdateRole = async (targetId, newRole) => {
    try {
      const res = await api.put(`/api/users/${targetId}`, { role: newRole });
      setUsersList(usersList.map(u => u._id === targetId ? { ...u, role: newRole } : u));
    } catch (e) {
      console.error(e);
      alert('Failed to update user role.');
    }
  };

  const handleDeleteUser = async (targetId) => {
    if (window.confirm('WARNING: Deleting this user will purge their account and delete all of their authored blogs. Are you sure?')) {
      try {
        await api.delete(`/api/users/${targetId}`);
        setUsersList(usersList.filter(u => u._id !== targetId));
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Blog Administration Updates
  const handleDeleteBlog = async (blogId) => {
    if (window.confirm('Are you sure you want to delete this blog post? This action is permanent.')) {
      try {
        await api.delete(`/api/blogs/${blogId}`);
        setBlogsList(blogsList.filter(b => b._id !== blogId));
      } catch (e) {
        console.error(e);
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 animate-pulse space-y-8">
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Admin Control Panel</h1>
            <p className="text-xs text-slate-400 mt-1">Manage user accounts, roles, spam moderation, and content auditing.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleTriggerAutoPost}
          disabled={triggeringPost}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-indigo-650 hover:from-primary-750 hover:to-indigo-750 text-white rounded-full text-xs font-bold transition-all shadow-md shadow-primary-500/10 disabled:opacity-50 cursor-pointer"
        >
          <Sparkles className={`w-4 h-4 ${triggeringPost ? 'animate-spin' : ''}`} />
          <span>{triggeringPost ? 'Generating AI Post...' : 'Trigger AI Auto-Post'}</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-xl dark:bg-rose-950/20 dark:border-rose-900/30">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-full w-fit mb-6 overflow-x-auto max-w-full">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-6 py-2 text-sm font-semibold rounded-full transition-all flex items-center gap-2 flex-shrink-0 ${
            activeTab === 'users'
              ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Profiles ({usersList.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('blogs')}
          className={`px-6 py-2 text-sm font-semibold rounded-full transition-all flex items-center gap-2 flex-shrink-0 ${
            activeTab === 'blogs'
              ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Blogs Moderation ({blogsList.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('restricted')}
          className={`px-6 py-2 text-sm font-semibold rounded-full transition-all flex items-center gap-2 flex-shrink-0 ${
            activeTab === 'restricted'
              ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-505" />
          <span>Restricted Words ({restrictedWords.length})</span>
        </button>
      </div>

      {/* Content Container */}
      <div className="p-6 border rounded-3xl bg-white border-slate-100 dark:bg-slate-900 shadow-sm">
        {activeTab === 'users' ? (
          /* Users Management Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                  <th className="pb-3 pl-2">User details</th>
                  <th className="pb-3">Email Address</th>
                  <th className="pb-3">Current Role</th>
                  <th className="pb-3">Update Role</th>
                  <th className="pb-3 text-right pr-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {usersList.map((usr) => (
                  <tr key={usr._id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-4 pl-2 flex items-center gap-3">
                      <img src={usr.profileImage} className="w-9 h-9 rounded-full object-cover" />
                      <div>
                        <span className="font-bold text-slate-850 dark:text-slate-100 block">{usr.name}</span>
                        <span className="text-[10px] text-slate-400">Created: {new Date(usr.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="py-4 text-slate-600 dark:text-slate-400">{usr.email}</td>
                    <td className="py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                        usr.role === 'admin'
                          ? 'bg-indigo-50 text-indigo-655 dark:bg-indigo-950/20 dark:text-indigo-400'
                          : usr.role === 'author'
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {usr.role}
                      </span>
                    </td>
                    <td className="py-4">
                      {usr._id !== user._id ? (
                        <select
                          value={usr.role}
                          onChange={(e) => handleUpdateRole(usr._id, e.target.value)}
                          className="px-2.5 py-1 text-xs border rounded-lg bg-slate-50 border-slate-200 dark:bg-slate-850 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none"
                        >
                          <option value="reader">Reader</option>
                          <option value="author">Author</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Self Account</span>
                      )}
                    </td>
                    <td className="py-4 text-right pr-2">
                      {usr._id !== user._id && (
                        <button
                          onClick={() => handleDeleteUser(usr._id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-955/20 rounded-lg transition-colors"
                          title="Purge User Account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'blogs' ? (
          /* Blogs Management Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                  <th className="pb-3 pl-2">Article details</th>
                  <th className="pb-3">Author details</th>
                  <th className="pb-3 text-center">Views</th>
                  <th className="pb-3 text-center">Likes</th>
                  <th className="pb-3 text-right pr-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {blogsList.map((blog) => (
                  <tr key={blog._id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-4 pl-2 font-semibold text-slate-800 dark:text-slate-100 max-w-xs truncate">
                      <Link to={`/blog/${blog.slug}`} className="hover:underline">{blog.title}</Link>
                      <span className="block text-[9px] text-slate-400 font-normal uppercase tracking-wider mt-0.5">
                        {blog.category ? `${blog.category} • ` : ''}{blog.status}
                      </span>
                    </td>
                    <td className="py-4 text-slate-600 dark:text-slate-400">
                      {blog.author?.name || 'Deleted Account'}
                    </td>
                    <td className="py-4 text-center font-semibold text-slate-700 dark:text-slate-300">{blog.views || 0}</td>
                    <td className="py-4 text-center font-semibold text-slate-700 dark:text-slate-300">{blog.likes?.length || 0}</td>
                    <td className="py-4 text-right pr-2">
                      <button
                        onClick={() => handleDeleteBlog(blog._id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-955/20 rounded-lg transition-colors"
                        title="Delete Post"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Restricted Words Tab */
          <div className="space-y-6">
            <div className="max-w-md">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Content Moderation & Filter</h3>
              <p className="text-xs text-slate-400 mt-1">
                Add words that you want to restrict on the platform. Users will be blocked from submitting posts or comments containing these keywords.
              </p>
              
              <form onSubmit={handleAddWord} className="flex gap-2 mt-4">
                <input
                  type="text"
                  value={newRestrictedWord}
                  onChange={(e) => setNewRestrictedWord(e.target.value)}
                  placeholder="e.g. spamword"
                  disabled={wordAdding}
                  className="flex-1 px-4 py-2.5 text-sm border rounded-xl bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={wordAdding || !newRestrictedWord.trim()}
                  className="px-5 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 rounded-xl transition-all shadow-md shadow-primary-500/10"
                >
                  {wordAdding ? 'Adding...' : 'Restrict Word'}
                </button>
              </form>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Restricted Word List</h4>
              {restrictedWords.length === 0 ? (
                <div className="p-6 text-center border border-dashed rounded-2xl text-slate-400 dark:border-slate-800 italic text-sm">
                  No restricted words configured yet. The platform is currently open!
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {restrictedWords.map((item) => (
                    <span
                      key={item._id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold border border-slate-200/50 dark:border-slate-800 transition-all"
                    >
                      <span>{item.word}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteWord(item._id)}
                        className="text-slate-400 hover:text-rose-500 transition-colors"
                        title="Remove word constraint"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
