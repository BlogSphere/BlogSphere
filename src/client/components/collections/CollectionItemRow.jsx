import React from 'react';
import { GripVertical, Trash2 } from 'lucide-react';
import { getCoverImageForBlog } from '../../utils/imageUtils';

export default function CollectionItemRow({ 
  index, 
  item, 
  onNoteChange, 
  onRemove, 
  onDragStart, 
  onDragOver, 
  onDragEnd 
}) {
  const blog = item.blog || {};
  const coverUrl = getCoverImageForBlog(blog);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnd={onDragEnd}
      className="flex items-center gap-4 p-4 bg-white dark:bg-[#141720] border border-slate-200 dark:border-[#232734] rounded-2xl cursor-grab active:cursor-grabbing transition-all hover:shadow-md hover:border-amber-500/40 group animate-fade-in"
    >
      {/* Drag Handle */}
      <div className="text-slate-400 dark:text-slate-500 group-hover:text-amber-500 transition-colors shrink-0">
        <GripVertical className="w-5 h-5" />
      </div>

      {/* Index Number */}
      <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-[#0b0d11] border border-slate-200 dark:border-[#232734] flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-400 shrink-0">
        {index + 1}
      </div>

      {/* Thumbnail */}
      <img
        src={coverUrl}
        alt={blog.title || 'Article'}
        className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-[#232734] shrink-0"
        onError={(e) => { e.target.src = getCoverImageForBlog({ title: (blog.title || '') + 'alt' }); }}
      />

      {/* Title & Notes Input */}
      <div className="flex-1 min-w-0 text-left">
        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate leading-snug">
          {blog.title || 'Untitled Article'}
        </h4>
        <input
          type="text"
          value={item.note || ''}
          onChange={(e) => onNoteChange(index, e.target.value)}
          placeholder="Add an optional curator note for this item..."
          className="w-full mt-1.5 px-3 py-1.5 text-xs border rounded-lg bg-slate-50 border-slate-200 dark:bg-[#0b0d11] dark:border-[#232734] focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-700 dark:text-slate-300"
        />
      </div>

      {/* Delete Trigger */}
      <button
        type="button"
        onClick={() => onRemove(blog._id)}
        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 dark:hover:bg-rose-955/20 rounded-xl transition-all shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
        title="Remove from Collection"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
