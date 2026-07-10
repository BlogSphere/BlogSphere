import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Tag, BookOpen, Compass, BookMarked, UserCheck } from 'lucide-react';
import api from '../utils/api.js';

const CATEGORIES = ['Technology', 'Travel', 'Food', 'Education', 'Sports'];
const POPULAR_TAGS = ['React', 'JavaScript', 'NodeJS', 'MERN', 'CSS', 'AI', 'WebDev'];

export default function Sidebar({ currentCategory, currentTag }) {
  const navigate = useNavigate();
  const [offlineArticles, setOfflineArticles] = useState([]);
  const [recommendedAuthors, setRecommendedAuthors] = useState([]);
  const [communities, setCommunities] = useState([]);

  useEffect(() => {
    // Load offline stored blogs
    const saved = localStorage.getItem('offline_blogs');
    if (saved) {
      setOfflineArticles(JSON.parse(saved));
    }

    // Load active authors / popular authors
    api.get('/api/blogs')
      .then((res) => {
        const blogs = res.data.blogs || [];
        // Extract unique authors
        const authors = [];
        const seen = new Set();
        for (const blog of blogs) {
          if (blog.author && !seen.has(blog.author._id)) {
            seen.add(blog.author._id);
            authors.push(blog.author);
          }
          if (authors.length >= 3) break;
        }
        setRecommendedAuthors(authors);
      })
      .catch(console.error);

    // Load communities list
    api.get('/api/communities')
      .then((res) => {
        setCommunities(res.data.communities || []);
      })
      .catch(console.error);
  }, []);

  return (
    <aside className="w-full lg:w-80 flex flex-col gap-6">
      {/* Galaxy Exploration Banner */}
      <div className="p-5 rounded-3xl border border-indigo-500/30 dark:border-indigo-500/20 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white relative overflow-hidden shadow-lg shadow-indigo-500/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-violet-500/20 via-transparent to-transparent pointer-events-none" />
        <h3 className="text-xs font-extrabold tracking-wider text-indigo-300 uppercase mb-2 flex items-center gap-1.5">
          <span className="inline-block animate-pulse">🌌</span>
          <span>Stellar Exploration</span>
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed mb-4 font-medium">
          Discover authors, articles, and topics connected as stars in a 3D/2D Knowledge Galaxy.
        </p>
        <Link
          to="/galaxy"
          className="w-full py-2.5 rounded-2xl text-center text-xs font-extrabold bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-650 hover:to-violet-650 transition-all text-white block shadow-md shadow-indigo-500/20"
        >
          Explore Galaxy View
        </Link>
      </div>

      {/* Categories Panel */}
      <div className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 glass-card">
        <h3 className="text-sm font-semibold tracking-wider text-slate-400 uppercase mb-4 flex items-center gap-2">
          <Compass className="w-4 h-4 text-primary-500" />
          <span>Categories</span>
        </h3>
        <div className="flex flex-col gap-2">
          {CATEGORIES.map((cat) => {
            const isActive = currentCategory === cat;
            return (
              <Link
                key={cat}
                to={isActive ? '/' : `/?category=${cat}`}
                className={`px-3 py-2 text-sm font-medium rounded-xl transition-colors flex justify-between items-center ${
                  isActive
                    ? 'bg-primary-50 text-primary-600 dark:bg-primary-950/20 dark:text-primary-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{cat}</span>
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Tags Panel */}
      <div className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 glass-card">
        <h3 className="text-sm font-semibold tracking-wider text-slate-400 uppercase mb-4 flex items-center gap-2">
          <Tag className="w-4 h-4 text-primary-500" />
          <span>Popular Tags</span>
        </h3>
        <div className="flex flex-wrap gap-2">
          {POPULAR_TAGS.map((tag) => {
            const isActive = currentTag === tag;
            return (
              <Link
                key={tag}
                to={isActive ? '/' : `/?tag=${tag}`}
                className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-all border ${
                  isActive
                    ? 'bg-primary-600 border-primary-600 text-white shadow-md shadow-primary-500/10'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-primary-500 dark:hover:border-primary-400'
                }`}
              >
                #{tag}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recommended Authors Panel */}
      {recommendedAuthors.length > 0 && (
        <div className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 glass-card">
          <h3 className="text-sm font-semibold tracking-wider text-slate-400 uppercase mb-4 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-primary-500" />
            <span>Popular Authors</span>
          </h3>
          <div className="flex flex-col gap-3">
            {recommendedAuthors.map((author) => (
              <Link
                key={author._id}
                to={`/profile/${author._id}`}
                className="flex items-center gap-3 group"
              >
                <img
                  src={author.profileImage}
                  alt={author.name}
                  className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-800"
                />
                <div>
                  <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200 group-hover:text-primary-600 transition-colors">
                    {author.name}
                  </h4>
                  <p className="text-[10px] text-slate-400 line-clamp-1">
                    {author.bio || 'Wandering explorer and wordsmith'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Communities Directory Panel */}
      {communities.length > 0 && (
        <div className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 glass-card">
          <h3 className="text-sm font-semibold tracking-wider text-slate-400 uppercase mb-4 flex items-center gap-2">
            <Compass className="w-4 h-4 text-primary-500" />
            <span>Popular Communities</span>
          </h3>
          <div className="flex flex-col gap-3">
            {communities.slice(0, 4).map((comm) => (
              <Link
                key={comm._id}
                to={`/communities`}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-800"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex items-center justify-center w-8 h-8 font-bold text-white rounded-lg bg-gradient-to-r from-primary-600 to-indigo-500 text-xs shadow-sm">
                    {comm.name[0]}
                  </span>
                  <div>
                    <span className="block text-xs font-bold text-slate-800 dark:text-slate-100">{comm.name}</span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">{comm.membersCount || 0} members</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400">View</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Saved Offline Articles */}
      <div className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 glass-card">
        <h3 className="text-sm font-semibold tracking-wider text-slate-400 uppercase mb-4 flex items-center gap-2">
          <BookMarked className="w-4 h-4 text-primary-500" />
          <span>Offline Reading</span>
        </h3>
        {offlineArticles.length === 0 ? (
          <p className="text-xs text-slate-400 italic">
            Save articles dynamically to read them when offline.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {offlineArticles.map((art) => (
              <Link
                key={art._id}
                to={`/blog/${art.slug}`}
                className="text-xs font-medium text-slate-600 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 line-clamp-2"
              >
                📖 {art.title}
              </Link>
            ))}
            <button
              onClick={() => {
                localStorage.removeItem('offline_blogs');
                setOfflineArticles([]);
              }}
              className="text-[10px] text-rose-500 hover:underline text-left mt-1 self-start"
            >
              Clear saved articles
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
