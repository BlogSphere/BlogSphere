import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Plus, FolderPlus, Folder, Check, Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext.jsx';
import { 
  fetchMyCollections, 
  addBlogToCollection, 
  createCollection,
  setAddToCollectionModal 
} from '../../redux/collectionSlice';
import { AnimatePresence, motion } from 'framer-motion';

export default function AddToCollectionModal() {
  const dispatch = useDispatch();
  const { showToast } = useToast();
  
  const { addToCollectionModal, myCollections } = useSelector((state) => state.collection);
  const { open, blogId } = addToCollectionModal;

  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [creatingInline, setCreatingInline] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    if (open) {
      dispatch(fetchMyCollections());
      setNote('');
      setNewTitle('');
      setCreatingInline(false);
    }
  }, [open, dispatch]);

  if (!open || !blogId) return null;

  const handleClose = () => {
    dispatch(setAddToCollectionModal({ open: false, blogId: null }));
  };

  const handleAddToCollection = async (collectionId) => {
    setLoading(true);
    try {
      await dispatch(addBlogToCollection({ collectionId, blogId, note })).unwrap();
      showToast('Article added to collection successfully!', 'success');
      handleClose();
    } catch (err) {
      showToast(typeof err === 'string' ? err : 'Already in this collection', 'warning');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAndAdd = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setLoading(true);
    try {
      const createdResult = await dispatch(createCollection({
        title: newTitle.trim(),
        description: 'Curated list',
        visibility: 'private'
      })).unwrap();

      const newCollectionId = createdResult.collection._id;
      await dispatch(addBlogToCollection({ collectionId: newCollectionId, blogId, note })).unwrap();
      
      showToast('Collection created and article added successfully!', 'success');
      handleClose();
    } catch (err) {
      showToast(typeof err === 'string' ? err : 'Failed to create collection', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal content */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="relative w-full max-w-md bg-white/90 dark:bg-slate-900/90 border border-slate-200/50 dark:border-slate-800 backdrop-blur-xl rounded-3xl p-6 shadow-2xl flex flex-col max-h-[85vh] text-slate-800 dark:text-slate-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-150/50 dark:border-slate-800/50">
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Folder className="w-5 h-5 text-indigo-500" />
              <span>Save to Collection</span>
            </h3>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-650 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
            {/* Note Input */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455 dark:text-slate-400">
                Curator Note (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 'Read Chapter 1 first', 'Highly recommended'"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs border rounded-xl bg-slate-50/50 border-slate-200 dark:bg-slate-950/30 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-350"
              />
            </div>

            {/* Collection Lists */}
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455 dark:text-slate-400 block mb-2">
                Choose a Collection
              </label>

              {myCollections.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  No collections created yet.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {myCollections.map((col) => {
                    const alreadyHasBlog = col.items?.some(item => item.blog?.toString() === blogId || item.blog?._id?.toString() === blogId);
                    return (
                      <button
                        key={col._id}
                        disabled={loading || alreadyHasBlog}
                        onClick={() => handleAddToCollection(col._id)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                          alreadyHasBlog
                            ? 'bg-slate-50/55 text-slate-400 border-slate-150/40 dark:bg-slate-950/20 dark:border-slate-850/30 cursor-not-allowed'
                            : 'bg-white/50 border-slate-200 hover:border-indigo-500/30 dark:bg-slate-900/40 dark:border-slate-800 hover:dark:bg-slate-950/40'
                        }`}
                      >
                        <span className="truncate">{col.title} ({col.itemsCount || 0})</span>
                        {alreadyHasBlog ? (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-555 font-bold uppercase">
                            <Check className="w-3.5 h-3.5" />
                            <span>Saved</span>
                          </span>
                        ) : (
                          <Plus className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Inline Creation */}
            <div className="pt-2 border-t border-slate-150/40 dark:border-slate-800/40">
              {creatingInline ? (
                <form onSubmit={handleCreateAndAdd} className="space-y-3 text-left">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455 dark:text-slate-400">
                      New Collection Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 'Web Dev Resources'"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs border rounded-xl bg-slate-50/50 border-slate-200 dark:bg-slate-950/30 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-350"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={loading || !newTitle.trim()}
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FolderPlus className="w-3.5 h-3.5" />}
                      <span>Create and Save</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreatingInline(false)}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setCreatingInline(true)}
                  className="w-full py-2.5 flex items-center justify-center gap-2 border border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-500/40 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-all active:scale-95"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>Create New Private Collection</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
