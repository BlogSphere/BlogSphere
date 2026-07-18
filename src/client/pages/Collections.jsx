import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Sparkles, Search, Compass, BookOpen, ChevronRight } from 'lucide-react';
import { fetchTrendingCollections, searchCollections } from '../redux/collectionSlice';
import CollectionCard from '../components/collections/CollectionCard.jsx';
import CollectionSEO from '../components/collections/CollectionSEO.jsx';
import { motion } from 'framer-motion';

const CATEGORIES = ['All', 'Technology', 'Travel', 'Food', 'Education', 'Sports'];

export default function Collections() {
  const dispatch = useDispatch();
  const { trendingCollections, searchResults } = useSelector((state) => state.collection);

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
    <div className="relative min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden">
      <CollectionSEO 
        title="Curated Collections & Reading Lists" 
        description="Browse human-curated reading lists, tutorials, and collection hubs on BlogSphere." 
      />

      {/* Glow Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 py-12 space-y-12 relative z-10">
        
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 rounded-full border border-indigo-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Community Curations</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
            Curated Collections
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Discover organized learning paths, article series, and favorite reads assembled by our community of authors.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="space-y-4">
          <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto relative flex items-center">
            <input
              type="text"
              placeholder="Search collections by title, tag, or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-3.5 pl-12 pr-28 border rounded-2xl bg-white/80 border-slate-200 dark:bg-slate-900/60 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-800 dark:text-slate-100 shadow-md shadow-slate-100/50 dark:shadow-none"
            />
            <Search className="absolute w-4 h-4 text-slate-400 left-4" />
            <button
              type="submit"
              className="absolute right-2 px-5 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm"
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
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-50'
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
              <Compass className="w-5 h-5 text-indigo-500" />
              <span>Search Results ({searchResults.length})</span>
            </h2>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-80 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
                ))}
              </div>
            ) : searchResults.length === 0 ? (
              <div className="py-12 text-center text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-6">
                <BookOpen className="w-10 h-10 mx-auto text-slate-455 mb-3" />
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
                  <Compass className="w-5 h-5 text-indigo-500" />
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
                <BookOpen className="w-5 h-5 text-indigo-500" />
                <span>Explore Curations</span>
              </h2>
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-80 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
                  ))}
                </div>
              ) : searchResults.length === 0 ? (
                <div className="py-12 text-center text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-6">
                  <BookOpen className="w-10 h-10 mx-auto text-slate-455 mb-3" />
                  <p className="text-sm font-semibold">No collections available yet.</p>
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
