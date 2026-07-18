import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { Folder, FolderPlus, Compass, FolderClosed, BookOpen } from 'lucide-react';
import { fetchMyCollections, deleteCollection } from '../redux/collectionSlice';
import CollectionList from '../components/collections/CollectionList.jsx';
import CollectionSEO from '../components/collections/CollectionSEO.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { motion } from 'framer-motion';

export default function MyCollections() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { myCollections, followedCollections, loading } = useSelector((state) => state.collection);
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState('curator'); // 'curator' or 'following'

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchMyCollections());
    }
  }, [dispatch, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="py-24 text-center max-w-md mx-auto px-4">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Access Denied</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Please log in to manage your collections.</p>
        <Link to="/login" className="inline-block px-6 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all">
          Sign In
        </Link>
      </div>
    );
  }

  const handleEdit = (collection) => {
    navigate(`/collections/${collection._id}/edit`);
  };

  const handleDeleteCollection = async (id) => {
    if (window.confirm('Are you sure you want to delete this collection?')) {
      try {
        await dispatch(deleteCollection(id)).unwrap();
        showToast('Collection deleted successfully.', 'success');
      } catch (err) {
        showToast('Failed to delete collection.', 'error');
      }
    }
  };

  return (
    <div className="space-y-6 text-left">
      <CollectionSEO title="Manage Curated Collections" />

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Folder className="w-6 h-6 text-indigo-500" />
            <span>Curated Collections</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
            Group, organize, and share sets of articles with other community readers.
          </p>
        </div>

        <Link
          to="/collections/new"
          className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/10 transition-all active:scale-95 self-start sm:self-center"
        >
          <FolderPlus className="w-3.5 h-3.5" />
          <span>Create Collection</span>
        </Link>
      </div>

      {/* Tabs selectors */}
      <div className="flex border-b border-slate-150/45 dark:border-slate-800/40">
        <button
          onClick={() => setActiveTab('curator')}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 -mb-[2px] ${
            activeTab === 'curator'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-extrabold'
              : 'border-transparent text-slate-450 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          My Curations ({myCollections.length})
        </button>
        
        <button
          onClick={() => setActiveTab('following')}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 -mb-[2px] ${
            activeTab === 'following'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-extrabold'
              : 'border-transparent text-slate-450 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Lists I Follow ({followedCollections.length})
        </button>
      </div>

      {/* Lists display */}
      {loading ? (
        <div className="py-12 space-y-4 animate-pulse">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
      ) : activeTab === 'curator' ? (
        <CollectionList
          collections={myCollections}
          onEdit={handleEdit}
          onDelete={handleDeleteCollection}
        />
      ) : (
        <CollectionList
          collections={followedCollections}
          showActions={false}
        />
      )}
    </div>
  );
}
