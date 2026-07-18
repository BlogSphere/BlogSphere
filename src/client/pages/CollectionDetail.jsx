import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  Calendar, 
  BookOpen, 
  Users, 
  Eye, 
  Edit3, 
  CornerDownRight, 
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { 
  fetchCollectionBySlug, 
  clearCurrentCollection,
  liveUpdateCurrentCollection 
} from '../redux/collectionSlice';
import CollectionFollowBtn from '../components/collections/CollectionFollowBtn.jsx';
import CollectionShareBtn from '../components/collections/CollectionShareBtn.jsx';
import CollectionVisibilityBadge from '../components/collections/CollectionVisibilityBadge.jsx';
import CollectionSEO from '../components/collections/CollectionSEO.jsx';
import { socket } from '../utils/socket.js';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

const FALLBACK_COVER = 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=800';

export default function CollectionDetail() {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { currentCollection, currentCollectionLoading, error } = useSelector((state) => state.collection);
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchCollectionBySlug(slug));

    return () => {
      dispatch(clearCurrentCollection());
    };
  }, [slug, dispatch]);

  // Socket connection for live updates
  useEffect(() => {
    if (currentCollection?._id) {
      socket.connect();
      socket.emit('join_collection', currentCollection._id);

      const handleLiveUpdate = (payload) => {
        dispatch(liveUpdateCurrentCollection({ collectionId: currentCollection._id, ...payload }));
      };

      const handleItemAdded = ({ item }) => {
        // Simple reload to fetch populated info
        dispatch(fetchCollectionBySlug(slug));
      };

      const handleItemRemoved = ({ blogId }) => {
        dispatch(fetchCollectionBySlug(slug));
      };

      const handleReordered = () => {
        dispatch(fetchCollectionBySlug(slug));
      };

      socket.on('collection:updated', handleLiveUpdate);
      socket.on('collection:item_added', handleItemAdded);
      socket.on('collection:item_removed', handleItemRemoved);
      socket.on('collection:reordered', handleReordered);

      return () => {
        socket.emit('leave_collection', currentCollection._id);
        socket.off('collection:updated', handleLiveUpdate);
        socket.off('collection:item_added', handleItemAdded);
        socket.off('collection:item_removed', handleItemRemoved);
        socket.off('collection:reordered', handleReordered);
      };
    }
  }, [currentCollection?._id, slug, dispatch]);

  if (currentCollectionLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 animate-pulse space-y-8">
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-24" />
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !currentCollection) {
    return (
      <div className="max-w-md mx-auto py-24 text-center px-4">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Collection Not Found</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          {error || 'This collection might have been deleted or visibility is restricted.'}
        </p>
        <Link to="/collections" className="inline-block px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all">
          Back to Discovery
        </Link>
      </div>
    );
  }

  const curator = currentCollection.curator || {};
  const isCurator = user && user._id === curator._id;
  const isFollowing = currentCollection.followers?.some(f => f.toString() === user?._id);
  const items = currentCollection.items || [];
  const coverUrl = currentCollection.coverImage || FALLBACK_COVER;

  return (
    <div className="relative min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden">
      <CollectionSEO 
        title={currentCollection.title} 
        description={currentCollection.description || `Curated collection by ${curator.name}`} 
      />

      {/* Glow Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 py-8 relative z-10 space-y-8">
        
        {/* Back Link */}
        <Link to="/collections" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors">
          <ChevronLeft className="w-4 h-4" />
          <span>All Collections</span>
        </Link>

        {/* Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl border border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl shadow-xl p-6 sm:p-8 flex flex-col md:flex-row gap-6 items-start"
        >
          {/* Cover image (scaled) */}
          <div className="w-full md:w-56 aspect-video md:aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-850 shrink-0 border border-slate-250/20 dark:border-slate-800/40">
            <img 
              src={coverUrl} 
              alt={currentCollection.title}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.src = FALLBACK_COVER; }}
            />
          </div>

          {/* Details */}
          <div className="flex-1 space-y-4 text-left w-full min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <CollectionVisibilityBadge visibility={currentCollection.visibility} />
              {currentCollection.category && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 border border-indigo-500/10 text-indigo-650 dark:text-indigo-400 px-2 py-0.5 rounded-full">
                  {currentCollection.category}
                </span>
              )}
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
                {currentCollection.title}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl">
                {currentCollection.description || 'No description provided for this collection.'}
              </p>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                <span>{currentCollection.itemsCount || 0} Articles</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-500" />
                <span>{currentCollection.followersCount || 0} Followers</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-indigo-500" />
                <span>{currentCollection.viewsCount || 0} Views</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-500" />
                <span>Updated {format(new Date(currentCollection.updatedAt), 'MMM d, yyyy')}</span>
              </span>
            </div>

            {/* Actions / Curator Row */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-150/45 dark:border-slate-800/40">
              <div className="flex items-center gap-2.5">
                <img
                  src={curator.profileImage || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(curator.name || 'C')}`}
                  alt={curator.name}
                  className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-800"
                />
                <div className="leading-tight">
                  <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    Curated by {curator.name}
                  </span>
                  <span className="text-[10px] text-slate-455 dark:text-slate-500">
                    @{curator.username}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <CollectionShareBtn 
                  collectionTitle={currentCollection.title} 
                  collectionSlug={currentCollection.slug} 
                />
                
                {isAuthenticated && (
                  <CollectionFollowBtn 
                    collectionId={currentCollection._id} 
                    curatorId={curator._id} 
                    initialIsFollowing={isFollowing} 
                  />
                )}

                {isCurator && (
                  <Link
                    to={`/collections/${currentCollection._id}/edit`}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/10 transition-all active:scale-95"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit List</span>
                  </Link>
                )}
              </div>
            </div>

          </div>
        </motion.div>

        {/* Tags */}
        {currentCollection.tags && currentCollection.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 text-left justify-start">
            {currentCollection.tags.map(tag => (
              <span key={tag} className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Collection Articles List */}
        <div className="space-y-4">
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 text-left">
            <BookOpen className="w-5 h-5 text-indigo-500" />
            <span>Curated Articles ({items.length})</span>
          </h2>

          {items.length === 0 ? (
            <div className="py-16 text-center text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-6">
              <BookOpen className="w-10 h-10 mx-auto text-slate-455 mb-3" />
              <p className="text-sm font-semibold">This collection does not contain any articles yet.</p>
              {isCurator && (
                <Link to={`/collections/${currentCollection._id}/edit`} className="inline-block mt-4 px-5 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold">
                  Add Articles Now
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => {
                const blog = item.blog || {};
                const author = blog.author || {};
                
                return (
                  <motion.div
                    key={blog._id || index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex flex-col md:flex-row items-start gap-4 p-5 bg-white/60 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/50 backdrop-blur rounded-3xl hover:shadow-md hover:border-indigo-500/20 transition-all duration-300 text-left"
                  >
                    {/* Index Badge */}
                    <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/10 text-indigo-650 dark:text-indigo-400 flex items-center justify-center font-black text-sm shrink-0">
                      {index + 1}
                    </div>

                    {/* Blog Cover */}
                    <img 
                      src={blog.coverImage || FALLBACK_COVER} 
                      alt={blog.title}
                      className="w-full md:w-28 aspect-video md:aspect-[4/3] rounded-2xl object-cover shrink-0 border border-slate-200 dark:border-slate-850"
                      onError={(e) => { e.target.src = FALLBACK_COVER; }}
                    />

                    {/* Blog details */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {blog.category && (
                          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-455 dark:text-slate-400">
                            {blog.category}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">•</span>
                        <span className="text-[10px] text-slate-450 dark:text-slate-500 font-bold">
                          by @{author.username || 'author'}
                        </span>
                      </div>

                      <Link 
                        to={`/blog/${blog.slug}`}
                        className="block text-base font-black text-slate-900 dark:text-white hover:text-indigo-650 dark:hover:text-indigo-400 transition-colors line-clamp-2 leading-snug"
                      >
                        {blog.title || 'Untitled Article'}
                      </Link>

                      {/* Curator note */}
                      {item.note && (
                        <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 dark:bg-indigo-950/20 dark:border-indigo-900/30 text-xs">
                          <CornerDownRight className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                          <div className="text-slate-600 dark:text-slate-350 leading-relaxed font-semibold italic">
                            <span className="font-bold text-indigo-650 dark:text-indigo-400 not-italic block mb-0.5 text-[10px] uppercase tracking-wide">Curator's Note:</span>
                            "{item.note}"
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 md:self-center shrink-0 self-end">
                      <Link
                        to={`/blog/${blog.slug}`}
                        className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all"
                        title="Read Article"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>

                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
