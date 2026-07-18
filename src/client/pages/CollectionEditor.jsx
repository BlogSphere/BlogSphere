import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Search, 
  Trash2, 
  Loader2, 
  Sparkles, 
  BookOpen, 
  Globe, 
  EyeOff, 
  Lock 
} from 'lucide-react';
import { 
  createCollection, 
  updateCollection, 
  deleteCollection,
  reorderCollectionItems 
} from '../redux/collectionSlice';
import CollectionItemRow from '../components/collections/CollectionItemRow.jsx';
import CollectionSEO from '../components/collections/CollectionSEO.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api from '../utils/api.js';
import { motion } from 'framer-motion';

export default function CollectionEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showToast } = useToast();

  const { myCollections } = useSelector((state) => state.collection);
  const isEditMode = !!id;

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [visibility, setVisibility] = useState('private');
  const [category, setCategory] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  
  // Items in collection
  const [items, setItems] = useState([]); // Array of { blog: BlogObject, note: string }

  // Left pane blog search states
  const [searchQuery, setSearchQuery] = useState('');
  const [availableBlogs, setAvailableBlogs] = useState([]);
  const [blogsLoading, setBlogsLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  // Drag states
  const draggedIndexRef = useRef(null);

  // Load existing collection details if in edit mode
  useEffect(() => {
    if (isEditMode) {
      const loadCollection = async () => {
        setLoading(true);
        try {
          // Fetch directly from API to ensure fresh data
          const res = await api.get(`/api/collections/detail-by-id/${id}`);
          const col = res.data.collection;
          if (col) {
            setTitle(col.title);
            setDescription(col.description || '');
            setCoverImage(col.coverImage || '');
            setVisibility(col.visibility);
            setCategory(col.category || '');
            setTags(col.tags || []);
            setItems(col.items || []);
          }
        } catch (err) {
          showToast('Failed to load collection details.', 'error');
          navigate('/dashboard/collections');
        } finally {
          setLoading(false);
        }
      };
      loadCollection();
    }
  }, [id, isEditMode, navigate]);

  // Load available blogs for search
  const searchAvailableBlogs = async (q = '') => {
    setBlogsLoading(true);
    try {
      const res = await api.get('/api/blogs', { params: { search: q, limit: 30 } });
      const blogsList = res.data.blogs || [];
      // Filter out blogs already in the collection
      const existingIds = new Set(items.map(item => item.blog?._id || item.blog));
      setAvailableBlogs(blogsList.filter(b => !existingIds.has(b._id) && b.status === 'published'));
    } catch (err) {
      console.error(err);
    } finally {
      setBlogsLoading(false);
    }
  };

  useEffect(() => {
    searchAvailableBlogs(searchQuery);
  }, [searchQuery, items]);

  const handleAddBlog = (blog) => {
    if (items.some(item => (item.blog?._id || item.blog) === blog._id)) {
      showToast('Article already added!', 'warning');
      return;
    }
    setItems([...items, { blog, note: '', order: items.length }]);
    showToast(`Added "${blog.title}"`, 'success');
  };

  const handleRemoveBlog = (blogId) => {
    setItems(items.filter(item => (item.blog?._id || item.blog) !== blogId));
  };

  const handleNoteChange = (index, value) => {
    const updated = [...items];
    updated[index] = { ...updated[index], note: value };
    setItems(updated);
  };

  // Drag and Drop implementation
  const handleDragStart = (e, index) => {
    draggedIndexRef.current = index;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    const draggedIndex = draggedIndexRef.current;
    if (draggedIndex === null || draggedIndex === index) return;

    const updated = [...items];
    const draggedItem = updated[draggedIndex];
    
    // Swap items in state
    updated.splice(draggedIndex, 1);
    updated.splice(index, 0, draggedItem);
    
    draggedIndexRef.current = index;
    setItems(updated);
  };

  const handleDragEnd = () => {
    draggedIndexRef.current = null;
    // Re-assign correct orders
    const updated = items.map((item, idx) => ({ ...item, order: idx }));
    setItems(updated);
  };

  // Tags Handler
  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const cleaned = tagInput.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleaned && !tags.includes(cleaned)) {
        setTags([...tags, cleaned]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (indexToRemove) => {
    setTags(tags.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast('Collection title is required.', 'error');
      return;
    }

    setLoading(true);
    const data = {
      title: title.trim(),
      description,
      coverImage,
      visibility,
      category,
      tags
    };

    try {
      let savedCollection;
      if (isEditMode) {
        const result = await dispatch(updateCollection({ id, data })).unwrap();
        savedCollection = result.collection;
        
        // Sync orders
        const itemsToSync = items.map((item, idx) => ({
          blogId: item.blog?._id || item.blog,
          order: idx
        }));
        await dispatch(reorderCollectionItems({ collectionId: id, items: itemsToSync })).unwrap();
        
        // Update per-item notes (we can update notes by calling update collection api or inline item endpoints)
        // For notes, we can update items list on collection directly
        const itemsWithNotes = items.map((item, idx) => ({
          blogId: item.blog?._id || item.blog,
          note: item.note,
          order: idx
        }));
        
        // We will call a custom route if needed or update items. Let's make sure it updates
        await api.put(`/api/collections/${id}/sync-notes`, { items: itemsWithNotes });

        showToast('Curated collection updated successfully!', 'success');
      } else {
        const result = await dispatch(createCollection(data)).unwrap();
        savedCollection = result.collection;

        // Add items to the newly created collection
        for (const item of items) {
          await api.post(`/api/collections/${savedCollection._id}/items`, {
            blogId: item.blog?._id || item.blog,
            note: item.note
          });
        }
        showToast('Curated collection created successfully!', 'success');
      }

      navigate(`/collections/${savedCollection.slug}`);
    } catch (err) {
      showToast(typeof err === 'string' ? err : 'Save failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this collection permanently? This action cannot be undone.')) {
      setLoading(true);
      try {
        await dispatch(deleteCollection(id)).unwrap();
        showToast('Collection deleted successfully', 'success');
        navigate('/dashboard/collections');
      } catch (err) {
        showToast('Failed to delete collection', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden">
      <CollectionSEO 
        title={isEditMode ? 'Edit Curated Collection' : 'Create Curated Collection'} 
      />

      {/* Glow Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 py-8 relative z-10 space-y-8">
        
        {/* Top bar actions */}
        <div className="flex items-center justify-between">
          <Link to="/dashboard/collections" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-650 dark:text-slate-400 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>

          <div className="flex items-center gap-2">
            {isEditMode && (
              <button
                type="button"
                disabled={loading}
                onClick={handleDelete}
                className="px-4 py-2 bg-rose-50/50 border border-rose-250 text-rose-600 hover:bg-rose-50 dark:bg-rose-955/10 dark:border-rose-900/40 dark:text-rose-400 rounded-xl text-xs font-bold transition-all active:scale-95"
              >
                Delete List
              </button>
            )}
            <button
              type="button"
              disabled={loading}
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/10 transition-all active:scale-95"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{isEditMode ? 'Save Changes' : 'Publish Collection'}</span>
            </button>
          </div>
        </div>

        {/* Title input */}
        <div className="text-left max-w-xl">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4">
            {isEditMode ? 'Edit Curated Collection' : 'Create Curated Collection'}
          </h2>
          <input
            type="text"
            required
            placeholder="Collection Title (e.g. 'Mastering React state management')"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-lg sm:text-xl font-bold py-3 px-4 border rounded-2xl bg-white/80 border-slate-200 dark:bg-slate-900/60 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-850 dark:text-slate-100 shadow-sm"
          />
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Form Settings & Blog Search (Left Pane) - 5 columns */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <div className="p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl shadow-lg space-y-4">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                Settings
              </h3>
              
              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455 dark:text-slate-400">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs border rounded-xl bg-slate-50/50 border-slate-200 dark:bg-slate-950/30 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-350"
                >
                  <option value="">Select Category...</option>
                  <option value="Technology">Technology</option>
                  <option value="Travel">Travel</option>
                  <option value="Food">Food</option>
                  <option value="Education">Education</option>
                  <option value="Sports">Sports</option>
                </select>
              </div>

              {/* Visibility */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455 dark:text-slate-400">
                  Visibility
                </label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs border rounded-xl bg-slate-50/50 border-slate-200 dark:bg-slate-950/30 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-350"
                >
                  <option value="private">Private (Only you can view)</option>
                  <option value="unlisted">Unlisted (Shareable via slug/link)</option>
                  <option value="public">Public (Visible to everyone & Discovery)</option>
                </select>
              </div>

              {/* Cover Image URL */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455 dark:text-slate-400">
                  Cover Image URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/cover.jpg"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs border rounded-xl bg-slate-50/50 border-slate-200 dark:bg-slate-950/30 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-350"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455 dark:text-slate-400">
                  Description
                </label>
                <textarea
                  placeholder="Write a summary details about this curated collection..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 text-xs border rounded-xl bg-slate-50/50 border-slate-200 dark:bg-slate-950/30 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-350 resize-none"
                />
              </div>

              {/* Tags Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455 dark:text-slate-400">
                  Tags (Press Enter)
                </label>
                <input
                  type="text"
                  placeholder="react, tutorial, state"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  className="w-full px-3 py-2.5 text-xs border rounded-xl bg-slate-50/50 border-slate-200 dark:bg-slate-950/30 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-350"
                />
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {tags.map((tag, idx) => (
                      <span key={tag} className="inline-flex items-center gap-1 bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 border border-indigo-500/10 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
                        <span>#{tag}</span>
                        <button type="button" onClick={() => handleRemoveTag(idx)} className="hover:text-rose-500 font-black">x</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Articles Search Picker */}
            <div className="p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl shadow-lg space-y-4">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Select Articles
              </h3>

              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Search published articles to add..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-2 pl-9 pr-4 text-xs border rounded-xl bg-slate-50/55 border-slate-200 dark:bg-slate-950/30 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-350"
                />
                <Search className="absolute w-3.5 h-3.5 text-slate-400 left-3" />
              </div>

              {/* Blogs Results List */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {blogsLoading ? (
                  <div className="py-8 flex justify-center">
                    <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                  </div>
                ) : availableBlogs.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                    No matching articles found.
                  </div>
                ) : (
                  availableBlogs.map(blog => (
                    <div 
                      key={blog._id} 
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-950/30 transition-colors border border-transparent hover:border-slate-200/40 dark:hover:border-slate-800/45 text-left"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {blog.title}
                        </span>
                        <span className="text-[9px] text-slate-450 dark:text-slate-550 block">
                          by @{blog.author?.username || 'author'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddBlog(blog)}
                        className="p-1.5 bg-indigo-50 hover:bg-indigo-150 text-indigo-650 dark:bg-indigo-950/30 dark:text-indigo-400 rounded-lg transition-colors text-xs font-black shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Curated List Ordering (Right Pane) - 7 columns */}
          <div className="lg:col-span-7 space-y-4 text-left">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-500" />
                <span>Curated Article Order ({items.length})</span>
              </h3>
              <span className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded-md">
                Drag rows to reorder
              </span>
            </div>

            {items.length === 0 ? (
              <div className="py-24 text-center text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-6 bg-white/30 dark:bg-slate-900/20">
                <BookOpen className="w-10 h-10 mx-auto text-slate-455 mb-3" />
                <p className="text-sm font-semibold">Your collection list is empty.</p>
                <p className="text-xs text-slate-450 dark:text-slate-500 mt-1">Select articles from the left search panel to build your collection.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item, idx) => (
                  <CollectionItemRow
                    key={item.blog?._id || item.blog || idx}
                    index={idx}
                    item={item}
                    onNoteChange={handleNoteChange}
                    onRemove={handleRemoveBlog}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                  />
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
