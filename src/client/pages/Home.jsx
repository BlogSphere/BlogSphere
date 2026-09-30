import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Sparkles, TrendingUp, Flame, AlertCircle, Search, X } from 'lucide-react';
import BlogCard from '../components/BlogCard.jsx';
import Sidebar from '../components/Sidebar.jsx';
import api from '../utils/api.js';
import { getCache, setCache } from '../utils/cacheManager.js';
import { getUserAvatar, handleAvatarError } from '../utils/imageUtils.js';

export default function Home() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const category = searchParams.get('category');
  const tag = searchParams.get('tag');
  const search = searchParams.get('search');

  const { isAuthenticated } = useSelector((state) => state.auth);

  const [activeFeedTab, setActiveFeedTab] = useState(isAuthenticated ? 'recommended' : 'trending');
  const [blogs, setBlogs] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchType, setSearchType] = useState('blogs'); // 'blogs', 'authors', 'topics'
  
  // Pagination States
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  // Search & Filter States
  const [searchInput, setSearchInput] = useState(search || '');
  const [selectedCategory, setSelectedCategory] = useState(category || '');
  const [selectedTag, setSelectedTag] = useState(tag || '');
  const [sortOption, setSortOption] = useState('newest'); // 'newest', 'views', 'likes'

  // Sync state with URL changes
  useEffect(() => {
    setSelectedCategory(category || '');
    setSelectedTag(tag || '');
    setSearchInput(search || '');
  }, [category, tag, search]);

  // Load feed tabs: default to recommended if logged in, otherwise default to trending
  useEffect(() => {
    if (category || tag || search) {
      setActiveFeedTab('all');
    } else if (isAuthenticated) {
      setActiveFeedTab('recommended');
    } else {
      setActiveFeedTab('trending');
    }
  }, [isAuthenticated, category, tag, search]);

  // Fetch blogs based on active feed tab and filters
  const fetchBlogs = (pageNum, isAppend = false) => {
    const cacheKey = `home_${activeFeedTab}_p${pageNum}`;
    
    if (isAppend) {
      setLoadingMore(true);
    } else {
      // Fast load from cache for page 1 feeds
      if (pageNum === 1 && !selectedCategory && !selectedTag && !searchInput) {
        const cached = getCache(cacheKey);
        if (cached && Array.isArray(cached.blogs)) {
          setBlogs(cached.blogs);
          setHasMore(cached.hasMore || false);
          setTotalPages(cached.totalPages || 1);
          setLoading(false);
        } else {
          setLoading(true);
        }
      } else {
        setLoading(true);
      }
    }

    if (activeFeedTab === 'all' && searchType === 'authors') {
      api.get('/api/users/search/authors', { params: { search: searchInput } })
        .then((res) => {
          setUsersList(res.data.users || []);
          setBlogs([]);
          setLoading(false);
          setLoadingMore(false);
          setHasMore(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
          setLoadingMore(false);
          setHasMore(false);
        });
      return;
    }

    let endpoint = '/api/blogs';
    if (activeFeedTab === 'recommended') {
      endpoint = '/api/blogs/recommendations';
    } else if (activeFeedTab === 'trending') {
      endpoint = '/api/blogs/trending';
    }

    const params = {
      page: pageNum,
      limit: 10
    };

    if (activeFeedTab === 'all') {
      if (selectedCategory) params.category = selectedCategory;
      if (selectedTag) params.tag = selectedTag;
      if (searchInput) params.search = searchInput;
      if (sortOption) params.sortBy = sortOption;
    }

    api.get(endpoint, { params })
      .then((res) => {
        const list = res.data.blogs || [];
        const resHasMore = res.data.hasMore || false;
        const resTotalPages = res.data.totalPages || 1;

        if (isAppend) {
          setBlogs((prev) => [...prev, ...list]);
        } else {
          setBlogs(list);
          // Cache first page feed
          if (pageNum === 1 && !selectedCategory && !selectedTag && !searchInput) {
            setCache(cacheKey, { blogs: list, hasMore: resHasMore, totalPages: resTotalPages });
          }
        }
        setUsersList([]);
        setHasMore(resHasMore);
        setTotalPages(resTotalPages);
        setPage(pageNum);
        setLoading(false);
        setLoadingMore(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
        setLoadingMore(false);
        setHasMore(false);
      });
  };

  useEffect(() => {
    fetchBlogs(1, false);
  }, [activeFeedTab, selectedCategory, selectedTag, searchInput, sortOption, searchType]);



  return (
    <div className="min-h-screen pb-16">
      {/* Hero Header Section */}
      {!category && !tag && !search && (
        <section className="relative overflow-hidden py-16 sm:py-24 bg-slate-100/60 dark:bg-[#0e1118]/80 border-b border-slate-200/90 dark:border-slate-800/80 transition-colors">
          <div className="absolute inset-0 pointer-events-none opacity-0 dark:opacity-100 bg-[radial-gradient(ellipse_at_50%_35%,rgba(245,158,11,0.08)_0%,transparent_65%)]" />
          
          <div className="max-w-[95%] xl:max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 animate-fade-in space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-white/90 dark:bg-[#141720]/90 border border-slate-200 dark:border-slate-800 uppercase tracking-widest shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              <span>An Independent Home for Thoughtful Ideas</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-bold text-slate-900 dark:text-white tracking-tight leading-[1.08] max-w-4xl mx-auto">
              Where curious minds gather to read and write.
            </h1>

            <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 dark:text-slate-400 font-normal leading-relaxed">
              Explore insightful essays, deep perspectives, and curated collections from independent writers, thinkers, and builders across the world.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row justify-center items-center gap-3.5 max-w-xs sm:max-w-none mx-auto">
              <a
                href="#feed-start"
                className="px-7 py-3 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-sm text-center hover:scale-[1.02]"
              >
                Start Reading
              </a>
              <Link
                to="/editor"
                className="px-7 py-3 rounded-full text-xs font-bold uppercase tracking-wider bg-white hover:bg-slate-50 dark:bg-[#141720] dark:hover:bg-[#1b1f2b] transition-all border border-slate-200 dark:border-slate-800 text-center text-slate-800 dark:text-slate-200 shadow-xs hover:scale-[1.02]"
              >
                Write a Blog
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Main Feed Container */}
      <div id="feed-start" className="max-w-[95%] xl:max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Feed Column */}
          <main className="flex-1">
            {/* Search & Filter Bar */}
            {activeFeedTab === 'all' && (
              <div className="mb-6 p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#141720] flex flex-col md:flex-row gap-4 items-center justify-between shadow-xs">
                <div className="w-full md:flex-1 relative">
                  <input
                    type="text"
                    placeholder="Search blogs, essays, topics..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="w-full py-2.5 pl-10 pr-4 text-sm transition-all border rounded-xl bg-slate-50 border-slate-200 dark:bg-[#0b0d11] dark:border-slate-800 text-slate-900 dark:text-slate-100 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:focus:ring-amber-500/50 focus:bg-white dark:focus:bg-[#0b0d11]"
                  />
                  <Search className="absolute w-4 h-4 text-slate-400 dark:text-slate-500 top-3.5 left-3.5" />
                </div>
                
                <div className="flex flex-wrap w-full md:w-auto gap-3 items-center">
                  {/* Category Select */}
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3.5 py-2.5 text-xs font-semibold rounded-xl border bg-slate-50 border-slate-200 dark:bg-[#0b0d11] dark:border-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none dark:focus:border-slate-700 cursor-pointer"
                  >
                    <option value="">All Topics</option>
                    {['Technology', 'Travel', 'Food', 'Education', 'Sports'].map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>

                  {/* Sort Option Select */}
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="px-3.5 py-2.5 text-xs font-semibold rounded-xl border bg-slate-50 border-slate-200 dark:bg-[#0b0d11] dark:border-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none dark:focus:border-slate-700 cursor-pointer"
                  >
                    <option value="newest">Latest First</option>
                    <option value="views">Most Read</option>
                    <option value="likes">Most Applauded</option>
                  </select>

                  {/* Reset Filters */}
                  {(selectedCategory || selectedTag || searchInput || sortOption !== 'newest') && (
                    <button
                      onClick={() => {
                        setSearchInput('');
                        setSelectedCategory('');
                        setSelectedTag('');
                        setSortOption('newest');
                        setSearchType('blogs');
                        navigate('/');
                      }}
                      className="px-4 py-2.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:text-rose-400 rounded-xl transition-all"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            )}

            {activeFeedTab === 'all' && (
              <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
                {[
                  { id: 'blogs', label: 'All Articles' },
                  { id: 'topics', label: 'Trending Topics' }
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => {
                      setSearchType(type.id);
                      setBlogs([]);
                      setUsersList([]);
                    }}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all border flex-shrink-0 ${
                      searchType === type.id
                        ? 'bg-slate-900 border-slate-900 text-white dark:bg-amber-500 dark:border-amber-500 dark:text-slate-950 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            )}

            {/* Active Tag indicator */}
            {selectedTag && activeFeedTab === 'all' && (
              <div className="mb-4 flex items-center gap-2">
                <span className="text-xs text-stone-400 uppercase font-bold tracking-wider">Active Tag:</span>
                <span className="text-xs font-bold bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 px-3 py-1 rounded-full flex items-center gap-1.5 border border-stone-200 dark:border-stone-700">
                  #{selectedTag}
                  <button onClick={() => setSelectedTag('')} className="hover:text-rose-500"><X className="w-3 h-3" /></button>
                </span>
              </div>
            )}

            {/* Search/Category filter headings legacy notification */}
            {(category || tag || search) && activeFeedTab === 'recommended' && (
              <div className="mb-6 p-4 rounded-xl bg-white border border-stone-200 dark:bg-stone-900 dark:border-stone-800 flex items-center justify-between">
                <div className="text-sm font-medium text-stone-600 dark:text-stone-300">
                  Showing results for:{' '}
                  <span className="font-semibold text-stone-900 dark:text-white">
                    {category ? `Category: ${category}` : tag ? `#${tag}` : `Search query "${search}"`}
                  </span>
                </div>
                <Link to="/" className="text-xs text-stone-700 dark:text-stone-300 hover:underline font-bold">
                  Clear filters
                </Link>
              </div>
            )}

            {/* Feed Tabs Selector */}
            {!category && !tag && !search && (
              <div className="flex border-b border-slate-200 dark:border-slate-800 mb-8 overflow-x-auto scrollbar-none pb-0.5 whitespace-nowrap gap-2 sm:gap-4">
                {isAuthenticated && (
                  <button
                    onClick={() => setActiveFeedTab('recommended')}
                    className={`py-3 px-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
                      activeFeedTab === 'recommended'
                        ? 'border-amber-500 text-slate-900 dark:text-amber-400'
                        : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>For You</span>
                  </button>
                )}
                <button
                  onClick={() => setActiveFeedTab('trending')}
                  className={`py-3 px-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
                    activeFeedTab === 'trending'
                      ? 'border-amber-500 text-slate-900 dark:text-amber-400'
                      : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <TrendingUp className="w-4 h-4 text-amber-500" />
                  <span>Trending</span>
                </button>
                <button
                  onClick={() => setActiveFeedTab('all')}
                  className={`py-3 px-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
                    activeFeedTab === 'all'
                      ? 'border-amber-500 text-slate-900 dark:text-amber-400'
                      : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <Search className="w-4 h-4 text-slate-400" />
                  <span>Explore Topics</span>
                </button>
              </div>
            )}

            {/* Explore Target Renders */}
            {activeFeedTab === 'all' && searchType === 'authors' ? (
              loading ? (
                <div className="grid sm:grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="animate-pulse bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl h-44 p-6" />
                  ))}
                </div>
              ) : usersList.length === 0 ? (
                <div className="text-center py-16 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80">
                  <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No Users Found</h3>
                  <p className="text-slate-400 mt-1">We couldn't find any authors or users matching your search.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-6">
                  {usersList.map((usr) => (
                    <div key={usr._id} className="p-6 border border-slate-100 dark:border-slate-800/80 rounded-3xl bg-white dark:bg-slate-900/60 shadow-sm hover:shadow-md transition-all flex items-start gap-4">
                      <img
                        src={getUserAvatar(usr.profileImage, usr.name)}
                        alt={usr.name}
                        referrerPolicy="no-referrer"
                        onError={(e) => handleAvatarError(e, usr.name)}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-primary-500/10 bg-amber-500/10"
                      />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-slate-800 dark:text-slate-100">{usr.name}</h4>
                          <span className="px-2 py-0.5 text-[9px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full border border-amber-500/20">
                            {usr.badge || 'Writer'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-2">{usr.bio || 'No bio description yet.'}</p>
                        <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500">
                          <span>Reputation: <strong>{usr.reputationPoints || 0} pts</strong></span>
                          <Link to={`/profile/${usr._id}`} className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">
                            Profile →
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : activeFeedTab === 'all' && searchType === 'topics' ? (
              loading ? (
                <div className="animate-pulse space-y-6">
                  <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
                  <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
                </div>
              ) : (
                <div className="space-y-8 p-6 border border-slate-100 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900/60">
                  {/* Categories list */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Matching Categories</h3>
                    {[...new Set(blogs.map(b => b.category).filter(Boolean))].length === 0 ? (
                      <p className="text-xs text-slate-400">No categories found matching your query.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {[...new Set(blogs.map(b => b.category).filter(Boolean))].map(cat => (
                          <button
                            key={cat}
                            onClick={() => {
                              setSelectedCategory(cat);
                              setSearchType('blogs');
                            }}
                            className="px-3.5 py-1.5 text-xs font-semibold rounded-full bg-slate-50 border border-slate-100 dark:bg-slate-800 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-primary-950/20 hover:text-primary-600 dark:hover:text-primary-400 hover:border-primary-100 transition-all"
                          >
                            📁 {cat}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Tags list */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Matching Tags & Hashtags</h3>
                    {[...new Set(blogs.flatMap(b => b.tags || []))].length === 0 ? (
                      <p className="text-xs text-slate-400">No tags found matching your query.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {[...new Set(blogs.flatMap(b => b.tags || []))].map(tg => (
                          <button
                            key={tg}
                            onClick={() => {
                              setSelectedTag(tg);
                              setSearchType('blogs');
                            }}
                            className="px-3.5 py-1.5 text-xs font-semibold rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 hover:text-amber-500 transition-all"
                          >
                            # {tg}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            ) : loading ? (
              <div className="grid sm:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="animate-pulse bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl h-80 flex flex-col justify-between p-5">
                    <div className="bg-slate-200 dark:bg-slate-800 h-40 rounded-xl mb-4" />
                    <div className="bg-slate-200 dark:bg-slate-800 h-6 w-3/4 rounded-md mb-2" />
                    <div className="bg-slate-200 dark:bg-slate-800 h-4 w-1/2 rounded-md" />
                  </div>
                ))}
              </div>
            ) : blogs.length === 0 ? (
              <div className="text-center py-16 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80">
                <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No Articles Found</h3>
                <p className="text-slate-400 mt-1">We couldn't find any articles matching your preferences or search criteria.</p>
                <Link to="/editor" className="mt-6 inline-block bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-md">
                  Write the first one!
                </Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-6">
                {blogs.map((blog) => (
                  <BlogCard key={blog._id} blog={blog} />
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {(page > 1 || hasMore || totalPages > 1) && (
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-150 dark:border-slate-800 pt-6">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {totalPages > 1 ? `Page ${page} of ${totalPages}` : `Page ${page}`}
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchBlogs(page - 1, false)}
                    disabled={page === 1}
                    className="px-5 py-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white hover:bg-slate-55 dark:bg-slate-900 dark:hover:bg-slate-800 text-xs font-extrabold text-slate-600 dark:text-slate-350 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm"
                  >
                    ← Previous
                  </button>
                  
                  <button
                    onClick={() => fetchBlogs(page + 1, false)}
                    disabled={!hasMore}
                    className="px-6 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </main>

          {/* Right Sidebar Column */}
          <Sidebar currentCategory={category} currentTag={tag} />
        </div>
      </div>
    </div>
  );
}
