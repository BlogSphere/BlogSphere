import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, Heart, Clock, User, FolderPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { setAddToCollectionModal } from '../redux/collectionSlice';

import { getCoverImageForBlog } from '../utils/imageUtils';

// Clean text helper that handles both HTML and JSON block array structure
const getCleanText = (content) => {
  if (!content) return '';
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      return parsed.map(b => b.content || '').join(' ');
    }
  } catch (e) {}
  return content.replace(/<[^>]*>/g, ' ');
};

// Estimate reading time helper
const getReadTime = (content) => {
  const text = getCleanText(content).replace(/\s+/g, ' ').trim();
  if (!text) return 1;
  const wordCount = text.split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / 225));
};

// Stripping content for card snippet
const getSnippet = (content) => {
  const text = getCleanText(content).replace(/\s+/g, ' ').trim();
  return text.substring(0, 130) + (text.length > 130 ? '...' : '');
};

const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200';

export default function BlogCard({ blog }) {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  const readTime = getReadTime(blog.content);
  const snippet = getSnippet(blog.content);
  const totalReactions = (blog.likes?.length || 0)
    + (blog.reactions?.thumbsUp?.length || 0)
    + (blog.reactions?.heart?.length || 0)
    + (blog.reactions?.clap?.length || 0)
    + (blog.reactions?.laugh?.length || 0);
  const imageUrl = getCoverImageForBlog(blog);

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#141720] shadow-[0_2px_8px_rgba(15,23,42,0.03)] hover:shadow-[0_12px_28px_rgba(15,23,42,0.07)] hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300"
    >
      {/* Cover Image */}
      <Link to={`/blog/${blog.slug}`} className="block relative aspect-[16/9] overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img
          src={imageUrl}
          alt={blog.title}
          className="w-full h-full object-cover transform hover:scale-103 transition-transform duration-500"
          onError={(e) => { e.target.src = getCoverImageForBlog({ title: blog.title + 'alt' }); }}
        />
        {/* Category Badge */}
        {blog.category && (
          <span className="absolute top-3 left-3 bg-slate-900/85 dark:bg-amber-500/20 dark:text-amber-300 dark:border dark:border-amber-500/30 backdrop-blur-sm text-slate-100 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-xs">
            {blog.category}
          </span>
        )}
      </Link>

      {/* Card Content */}
      <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between space-y-4">
        <div>
          {/* Tags */}
          {blog.tags && blog.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {blog.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase hover:text-amber-500 transition-colors">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <Link to={`/blog/${blog.slug}`}>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 hover:text-amber-600 dark:hover:text-amber-400 transition-colors line-clamp-2 leading-tight tracking-tight">
              {blog.title}
            </h2>
          </Link>

          {/* Snippet */}
          <p className="mt-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed font-normal">
            {snippet}
          </p>
        </div>

        {/* Card Footer */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
          {/* Author */}
          {blog.author?._id ? (
            <Link to={`/profile/${blog.author._id}`} className="flex items-center gap-2.5 group">
              <img
                src={blog.author.profileImage || FALLBACK_AVATAR}
                alt={blog.author.name || 'Author'}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
              />
              <div>
                <span className="block text-xs font-bold text-slate-900 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {blog.author.name || 'Anonymous'}
                </span>
                <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                  {new Date(blog.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-2 text-slate-400">
              <User className="w-7 h-7 p-1 bg-slate-100 rounded-full dark:bg-slate-800" />
              <span className="text-xs font-medium">Anonymous</span>
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500 text-[11px] font-medium">
            <span className="flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" title="Views">
              <Eye className="w-3.5 h-3.5" />
              {blog.views || 0}
            </span>
            <span className="flex items-center gap-1 hover:text-rose-500 transition-colors" title="Reactions">
              <Heart className="w-3.5 h-3.5 text-rose-500/80" />
              {totalReactions}
            </span>
            <span className="flex items-center gap-1" title="Read time">
              <Clock className="w-3.5 h-3.5" />
              {readTime}m
            </span>
            {isAuthenticated && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  dispatch(setAddToCollectionModal({ open: true, blogId: blog._id }));
                }}
                className="flex items-center gap-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg"
                title="Add to Collection"
              >
                <FolderPlus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
}
