import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Sparkles, Search, Compass, BookOpen, ChevronRight, FolderPlus } from 'lucide-react';
import { fetchTrendingCollections, searchCollections } from '../redux/collectionSlice';
import CollectionCard from '../components/collections/CollectionCard.jsx';
import CollectionSEO from '../components/collections/CollectionSEO.jsx';
import { motion } from 'framer-motion';

const CATEGORIES = ['All', 'Technology', 'Travel', 'Food', 'Education', 'Sports'];

export default function Collections() {
  const dispatch = useDispatch();
  const { trendingCollections = [], searchResults = [] } = useSelector((state) => state.collection);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchTrendingCollections());
    handleSearch('');
  }, [dispatch]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    handleSearch(searchQuery, selectedCategory);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    handleSearch(searchQuery, category);
  };

  const handleSearch = async (q, cat = selectedCategory) => {
    setLoading(true);
    const params = {};
    if (q) params.q = q;
    if (cat && cat !== 'All') params.category = cat;
    
    await dispatch(searchCollections(params));
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen bg-slate-50/50 dark:bg-[#0b0d11] text-slate-800 dark:text-slate-100 overflow-hidden">
      <CollectionSEO 
        title="Curated Collections & Reading Lists" 
        description="Browse human-curated reading lists, tutorials, and collection hubs on BlogSphere." 
      />

      {/* Glow Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[50%] bg-amber-600/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 py-12 space-y-12 relative z-10">
        
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold text-amber-500 bg-amber-500/10 rounded-full border border-amber-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Curated Reading Lists</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-serif font-bold tracking-tight text-slate-900 dark:text-slate-50 leading-tight">
            Curated Collections
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Discover organized reading paths, essay series, and thematic anthologies assembled by writers and readers.
          </p>
          <div className="pt-2">
            <Link
              to="/collections/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-full text-xs font-semibold shadow-sm transition-all"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Create New Collection</span>
            </Link>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="space-y-4">
          <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto relative flex items-center">
            <input
              type="text"
              placeholder="Search collections by title, tag, or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-3 pl-12 pr-28 border rounded-2xl bg-white border-slate-200 dark:bg-[#141720] dark:border-[#232734] focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm text-slate-800 dark:text-slate-100 shadow-sm"
            />
            <Search className="absolute w-4 h-4 text-slate-400 left-4" />
            <button
              type="submit"
              className="absolute right-1.5 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-slate-950 rounded-xl text-xs font-semibold transition-all shadow-sm"
            >
              Search
            </button>
          </form>

          {/* Categories */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategoryChange(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-white/60 dark:bg-[#141720] border border-slate-200 dark:border-[#232734] text-slate-600 dark:text-slate-400 hover:border-amber-500/40'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Results Sections */}
        {searchQuery || selectedCategory !== 'All' ? (
          /* Search Results */
          <div className="space-y-6">
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-amber-500" />
              <span>Search Results ({searchResults.length})</span>
            </h2>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-80 bg-slate-200 dark:bg-[#141720] rounded-3xl" />
                ))}
              </div>
            ) : searchResults.length === 0 ? (
              <div className="py-12 text-center text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-[#232734] rounded-3xl p-6">
                <BookOpen className="w-10 h-10 mx-auto text-slate-400 mb-3" />
                <p className="text-sm font-semibold">No curated collections match your filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((col) => (
                  <CollectionCard key={col._id} collection={col} />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Landing/Default view (Trending + Top Collections) */
          <div className="space-y-12">
            {/* Trending Section */}
            {trendingCollections.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Compass className="w-5 h-5 text-amber-500" />
                  <span>Trending Curated Lists</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {trendingCollections.slice(0, 3).map((col) => (
                    <CollectionCard key={col._id} collection={col} />
                  ))}
                </div>
              </div>
            )}

            {/* General Discovery */}
            <div className="space-y-6">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-500" />
                <span>Explore Curations</span>
              </h2>
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-80 bg-slate-200 dark:bg-[#141720] rounded-3xl" />
                  ))}
                </div>
              ) : searchResults.length === 0 ? (
                <div className="py-16 text-center border border-dashed border-slate-200 dark:border-[#232734] rounded-3xl p-8 space-y-4 bg-white dark:bg-[#141720]/50 backdrop-blur-sm">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 shadow-sm">
                    <BookOpen className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-800 dark:text-white">No Curated Collections Found</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                      Be the first author to organize top articles into a public reading list for the community.
                    </p>
                  </div>
                  <Link
                    to="/collections/new"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                  >
                    <FolderPlus className="w-4 h-4" />
                    <span>Create Collection</span>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {searchResults.map((col) => (
                    <CollectionCard key={col._id} collection={col} />
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
