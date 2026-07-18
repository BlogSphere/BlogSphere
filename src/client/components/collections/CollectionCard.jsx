import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, BookOpen, Users, FolderOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import CollectionVisibilityBadge from './CollectionVisibilityBadge.jsx';

const FALLBACK_COVER = 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=800';

export default function CollectionCard({ collection }) {
  const curatorName = collection.curator?.name || 'Anonymous';
  const curatorUsername = collection.curator?.username || 'curator';
  const curatorAvatar = collection.curator?.profileImage || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(curatorName)}`;
  const coverUrl = collection.coverImage || FALLBACK_COVER;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl shadow-lg hover:shadow-2xl hover:border-indigo-500/20 transition-all duration-300 min-h-[380px]"
    >
      <div>
        {/* Cover Image & Badges */}
        <Link to={`/collections/${collection.slug}`} className="block relative aspect-video overflow-hidden bg-slate-100 dark:bg-slate-800">
          <img
            src={coverUrl}
            alt={collection.title}
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { e.target.src = FALLBACK_COVER; }}
          />
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            <CollectionVisibilityBadge visibility={collection.visibility} />
            {collection.category && (
              <span className="self-start text-[10px] font-bold tracking-wide bg-indigo-600 text-white px-2 py-0.5 rounded-full shadow-sm">
                {collection.category}
              </span>
            )}
          </div>
        </Link>

        {/* Content */}
        <div className="p-6 space-y-3">
          {/* Tags */}
          {collection.tags && collection.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {collection.tags.slice(0, 3).map(tag => (
                <span key={tag} className="text-[10px] text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border border-indigo-500/10 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <Link to={`/collections/${collection.slug}`} className="block">
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug">
              {collection.title}
            </h3>
          </Link>

          {/* Description */}
          {collection.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
              {collection.description}
            </p>
          )}
        </div>
      </div>

      {/* Footer Details */}
      <div className="p-6 pt-0 mt-auto border-t border-slate-150/40 dark:border-slate-800/40">
        <div className="flex items-center justify-between pt-4">
          {/* Curator Profile */}
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={curatorAvatar}
              alt={curatorName}
              className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-800 bg-slate-150"
            />
            <div className="text-left leading-none min-w-0">
              <span className="block text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                {curatorName}
              </span>
              <span className="text-[10px] text-slate-455 dark:text-slate-500 truncate block">
                @{curatorUsername}
              </span>
            </div>
          </div>

          {/* Statistics */}
          <div className="flex items-center gap-3 text-slate-455 dark:text-slate-500 text-[10px] font-bold">
            <span className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{collection.itemsCount || 0}</span>
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span>{collection.followersCount || 0}</span>
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              <span>{collection.viewsCount || 0}</span>
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
