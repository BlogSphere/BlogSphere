import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { BookOpen, Eye, Heart, Users, PenSquare, Trash2, TrendingUp, Sparkles, BarChart2, Folder } from 'lucide-react';
import api from '../utils/api.js';
import MyCollections from './MyCollections.jsx';
import BecomeWriterModal from '../components/BecomeWriterModal.jsx';

export default function Dashboard() {
  const { user } = useSelector((state) => state.auth);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('articles');
  const [isBecomeWriterOpen, setIsBecomeWriterOpen] = useState(false);

  // Search & Filter States
  const [dashSearch, setDashSearch] = useState('');
  const [dashStatus, setDashStatus] = useState('all');

  const [stats, setStats] = useState({
    totalBlogs: 0,
    totalViews: 0,
    totalLikes: 0,
    followersCount: 0,
    reputationPoints: 0,
    badge: 'Reader',
    averageReadTimeMinutes: 0,
    bounceRatePercent: 0,
    completionRatePercent: 0,
    topBlogTitle: 'No articles yet',
    topBlogSlug: ''
  });
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (user) {
      setLoading(true);
      
      const fetchBlogs = api.get(`/api/blogs?author=${user._id}&status=all`);
      const fetchStats = api.get('/api/users/dashboard/stats');

      Promise.all([fetchBlogs, fetchStats])
        .then(([blogsRes, statsRes]) => {
          setBlogs(blogsRes.data.blogs || []);
          setStats(statsRes.data.stats);
          setChartData(statsRes.data.chartData || []);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [user]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you absolutely sure you want to delete this blog? All history logs will be lost.')) {
      try {
        await api.delete(`/api/blogs/${id}`);
        setBlogs(blogs.filter(b => b._id !== id));
        setStats(prev => ({
          ...prev,
          totalBlogs: prev.totalBlogs - 1
        }));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const maxViews = chartData.length > 0 ? Math.max(...chartData.map(d => d.views)) : 100;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 animate-pulse space-y-8">
        <div className="grid grid-cols-4 gap-4 h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="max-w-[95%] 2xl:max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div>
        <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-slate-50 leading-tight">
          Welcome back, {user?.name}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Here is the reading performance and audience activity for your publication.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          { title: 'Total Articles', value: stats.totalBlogs, icon: BookOpen, color: 'text-amber-500 bg-amber-500/10 dark:bg-amber-500/10' },
          { title: 'Article Views', value: stats.totalViews, icon: Eye, color: 'text-amber-500 bg-amber-500/10 dark:bg-amber-500/10' },
          { title: 'Total Likes', value: stats.totalLikes, icon: Heart, color: 'text-amber-500 bg-amber-500/10 dark:bg-amber-500/10' },
          { title: 'Followers', value: stats.followersCount, icon: Users, color: 'text-amber-500 bg-amber-500/10 dark:bg-amber-500/10' }
        ].map((item) => (
          <div key={item.title} className="p-5 border rounded-2xl bg-white border-slate-200 dark:bg-[#141720] dark:border-[#232734] shadow-sm flex items-center gap-4">
            <div className={`p-3.5 rounded-xl ${item.color}`}>
              <item.icon className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-slate-400 text-[11px] font-semibold uppercase tracking-wider">{item.title}</span>
              <span className="block text-2xl font-bold font-serif text-slate-900 dark:text-slate-100 mt-0.5">{item.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Smart Insights Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          { title: 'Writer Standing', value: `${stats.badge}`, sub: `${stats.reputationPoints} reputation pts` },
          { title: 'Avg Read Time', value: `${stats.averageReadTimeMinutes} min`, sub: 'Estimated time spent' },
          { title: 'Completion Rate', value: `${stats.completionRatePercent}%`, sub: 'Scrolled through content' },
          { title: 'Quick Exit Rate', value: `${stats.bounceRatePercent}%`, sub: 'Exited under 10 seconds' }
        ].map((item) => (
          <div key={item.title} className="p-5 border rounded-2xl shadow-sm flex flex-col justify-between h-28 bg-slate-50/70 dark:bg-[#141720]/80 border-slate-200/80 dark:border-[#232734]">
            <span className="block text-slate-500 dark:text-slate-400 text-[10px] font-semibold uppercase tracking-wider">{item.title}</span>
            <div className="mt-2">
              <span className="block text-xl font-bold font-serif text-slate-900 dark:text-slate-100 leading-tight">{item.value}</span>
              <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-1">{item.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Chart & Popular Articles container */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* SVG Analytics Chart */}
        <div className="lg:col-span-2 p-6 border rounded-3xl bg-white border-slate-200 dark:bg-[#141720] dark:border-[#232734] shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-serif font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              <span>Weekly Readership Frequency</span>
            </h3>
            <span className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full font-medium">Views per Day</span>
          </div>

          {/* SVG Bar Chart */}
          <div className="relative w-full h-56 flex items-end justify-between px-2 pt-6">
            {chartData.map((data) => {
              const barHeight = `${(data.views / maxViews) * 80}%`;
              return (
                <div key={data.day} className="flex-1 flex flex-col items-center group relative">
                  {/* Tooltip */}
                  <span className="absolute -top-6 bg-slate-900 text-amber-300 text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-medium">
                    {data.views} views
                  </span>
                  
                  {/* Dynamic Bar */}
                  <div
                    style={{ height: barHeight }}
                    className="w-8 sm:w-12 bg-gradient-to-t from-amber-600 to-amber-400 rounded-t transition-all hover:from-amber-500 hover:to-amber-300 shadow-sm"
                  />
                  <span className="text-xs text-slate-500 font-medium mt-2">{data.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top performing articles / tip box */}
        <div className="p-7 border rounded-3xl bg-slate-900 dark:bg-[#141720] text-white shadow-md flex flex-col justify-between relative overflow-hidden border-slate-800 dark:border-[#232734]">
          <div className="relative z-10 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-0.5 rounded-full">
                {user?.role === 'reader' ? 'Reader Account' : 'Writer Insights'}
              </span>
            </div>
            <h3 className="text-xl font-serif font-bold tracking-tight">
              {user?.role === 'reader' ? 'Share your perspectives with readers' : 'Reader Interest Insights'}
            </h3>
            <p className="text-sm leading-relaxed text-slate-300 font-normal">
              {user?.role === 'reader'
                ? 'You are currently browsing BlogSphere as a Reader. Upgrade to a Writer to publish thoughtful essays, create curated collections, and build your audience.'
                : 'Your articles focusing on JavaScript and MERN are outperforming other topics by 45%. A follow-up piece this week could bring new subscribers.'}
            </p>
          </div>
          {user?.role === 'reader' ? (
            <button
              onClick={() => setIsBecomeWriterOpen(true)}
              className="relative z-10 mt-6 w-full py-2.5 text-center text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-full transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Become a Writer (Free)</span>
            </button>
          ) : (
            <Link
              to="/editor"
              className="relative z-10 mt-6 w-full py-2.5 text-center text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-full transition-colors inline-block"
            >
              Write New Story
            </Link>
          )}
        </div>
      </div>

      {/* Tabs for Articles vs Collections */}
      <div className="flex border-b border-slate-200 dark:border-[#232734] gap-6 mb-2">
        <button
          onClick={() => setActiveTab('articles')}
          className={`pb-3 text-sm font-medium transition-all border-b-2 -mb-[2px] ${
            activeTab === 'articles'
              ? 'border-amber-500 text-slate-900 dark:text-white font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Articles
        </button>
        <button
          onClick={() => setActiveTab('collections')}
          className={`pb-3 text-sm font-medium transition-all border-b-2 -mb-[2px] ${
            activeTab === 'collections'
              ? 'border-amber-500 text-slate-900 dark:text-white font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Curated Collections
        </button>
      </div>

      {activeTab === 'articles' ? (
        <div className="p-6 border rounded-3xl bg-white border-slate-200 dark:bg-[#141720] dark:border-[#232734] shadow-sm">
          {(() => {
            const filteredBlogs = blogs.filter((blog) => {
              const matchesSearch = blog.title?.toLowerCase().includes(dashSearch.toLowerCase()) || 
                                    blog.category?.toLowerCase().includes(dashSearch.toLowerCase()) ||
                                    blog.tags?.some(tag => tag.toLowerCase().includes(dashSearch.toLowerCase()));
              const matchesStatus = dashStatus === 'all' || blog.status === dashStatus;
              return matchesSearch && matchesStatus;
            });

            return (
              <>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                  <div>
                    <h3 className="text-base font-serif font-bold text-slate-900 dark:text-slate-100">Authored Articles</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Filter and manage your stories, drafts, and scheduled posts.</p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-medium px-3 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {filteredBlogs.length} / {blogs.length} Stories
                    </span>
                  </div>
                </div>

                {/* Dashboard Search/Filter Row */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <input
                    type="text"
                    placeholder="Search by title, category, tags..."
                    value={dashSearch}
                    onChange={(e) => setDashSearch(e.target.value)}
                    className="flex-1 px-4 py-2.5 text-xs border rounded-xl bg-slate-50 border-slate-200 dark:bg-[#0b0d11] dark:border-[#232734] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white dark:focus:bg-[#141720]"
                  />
                  <select
                    value={dashStatus}
                    onChange={(e) => setDashStatus(e.target.value)}
                    className="px-3.5 py-2.5 text-xs font-medium rounded-xl border bg-slate-50 border-slate-200 dark:bg-[#0b0d11] dark:border-[#232734] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="published">Published</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="draft">Drafts</option>
                  </select>
                </div>

                {filteredBlogs.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-400 text-sm">No articles matched your search or status query.</p>
                    {blogs.length === 0 && (
                      user?.role === 'reader' ? (
                        <button
                          onClick={() => setIsBecomeWriterOpen(true)}
                          className="mt-4 inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold px-4 py-2 rounded-full shadow-sm"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Upgrade to Writer to Publish</span>
                        </button>
                      ) : (
                        <Link to="/editor" className="mt-4 inline-block bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold px-4 py-2 rounded-full shadow-sm">
                          Write your first article
                        </Link>
                      )
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                          <th className="pb-3 pl-2">Title</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3 text-center">Views</th>
                          <th className="pb-3 text-center">Likes</th>
                          <th className="pb-3 text-right pr-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredBlogs.map((blog) => (
                          <tr key={blog._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="py-4 pl-2 font-serif font-semibold text-slate-900 dark:text-slate-100 max-w-xs truncate text-base">
                              <Link to={`/blog/${blog.slug}`} className="hover:text-amber-500 transition-colors">{blog.title}</Link>
                            </td>
                            <td className="py-4">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border ${
                                blog.status === 'published'
                                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                                  : blog.status === 'scheduled'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900'
                                  : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                              }`}>
                                {blog.status}
                              </span>
                            </td>
                            <td className="py-4 text-center font-medium text-slate-600 dark:text-slate-300">{blog.views || 0}</td>
                            <td className="py-4 text-center font-medium text-slate-600 dark:text-slate-300">{blog.likes?.length || 0}</td>
                            <td className="py-4 text-right pr-2">
                              <div className="flex justify-end gap-2">
                                <Link
                                  to={`/editor?edit=${blog._id}`}
                                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-amber-500 dark:hover:text-amber-400 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <PenSquare className="w-4 h-4" />
                                </Link>
                                <button
                                  onClick={() => handleDelete(blog._id)}
                                  className="p-2 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      ) : (
        <div className="p-6 border rounded-3xl bg-white border-slate-200 dark:bg-[#141720] dark:border-[#232734] shadow-sm">
          <MyCollections />
        </div>
      )}

      {/* Become Writer Modal */}
      <BecomeWriterModal
        isOpen={isBecomeWriterOpen}
        onClose={() => setIsBecomeWriterOpen(false)}
        onSuccess={() => {
          setIsBecomeWriterOpen(false);
          window.location.reload();
        }}
      />
    </div>
  );
}
