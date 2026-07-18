import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, Eye, Edit3, Trash2, Globe, Shield } from 'lucide-react';
import CollectionVisibilityBadge from './CollectionVisibilityBadge.jsx';

const FALLBACK_COVER = 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=800';

export default function CollectionList({ collections, onEdit, onDelete, showActions = true }) {
  if (!collections || collections.length === 0) {
    return (
      <div className="py-12 text-center text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-6">
        <BookOpen className="w-10 h-10 mx-auto text-slate-400 mb-3 animate-pulse" />
        <p className="text-sm font-semibold">No collections found.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white/40 dark:bg-slate-900/40 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden shadow-md">
      {collections.map((collection) => {
        const coverUrl = collection.coverImage || FALLBACK_COVER;
        return (
          <div 
            key={collection._id} 
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors duration-250"
          >
            {/* Left Content (Image + Text) */}
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <img 
                src={coverUrl} 
                alt={collection.title}
                className="w-16 h-16 rounded-xl object-cover border border-slate-200/60 dark:border-slate-800 bg-slate-100 shrink-0"
                onError={(e) => { e.target.src = FALLBACK_COVER; }}
              />
              <div className="min-w-0 text-left">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <Link 
                    to={`/collections/${collection.slug}`}
                    className="text-base font-bold text-slate-800 dark:text-slate-150 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate"
                  >
                    {collection.title}
                  </Link>
                  <CollectionVisibilityBadge visibility={collection.visibility} />
                </div>
                <p className="text-xs text-slate-455 dark:text-slate-400 line-clamp-1 leading-relaxed">
                  {collection.description || 'No description provided.'}
                </p>
                
                {/* Stats row */}
                <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    {collection.itemsCount || 0} Articles
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {collection.followersCount || 0} Followers
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    {collection.viewsCount || 0} Views
                  </span>
                </div>
              </div>
            </div>

            {/* Right Content (Actions) */}
            {showActions && (
              <div className="flex items-center gap-2 self-end sm:self-center">
                {onEdit && (
                  <button
                    onClick={() => onEdit(collection)}
                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-500/10 dark:hover:bg-indigo-950/20 rounded-xl transition-all"
                    title="Edit Collection"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(collection._id)}
                    className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-500/10 dark:hover:bg-rose-950/20 rounded-xl transition-all"
                    title="Delete Collection"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
