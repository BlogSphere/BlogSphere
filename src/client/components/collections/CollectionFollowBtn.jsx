import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Users, UserMinus, UserPlus } from 'lucide-react';
import { useToast } from '../../context/ToastContext.jsx';
import { followCollection, unfollowCollection } from '../../redux/collectionSlice';
import { motion } from 'framer-motion';

export default function CollectionFollowBtn({ collectionId, curatorId, initialIsFollowing }) {
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);

  const isCurator = user && user._id === curatorId;

  if (isCurator) return null; // Curator can't follow their own collection

  const handleFollowClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      showToast('Please sign in to follow collections.', 'warning');
      return;
    }

    setLoading(true);
    try {
      if (isFollowing) {
        await dispatch(unfollowCollection(collectionId)).unwrap();
        setIsFollowing(false);
        showToast('Unfollowed collection', 'success');
      } else {
        await dispatch(followCollection(collectionId)).unwrap();
        setIsFollowing(true);
        showToast('Following collection', 'success');
      }
    } catch (err) {
      showToast(typeof err === 'string' ? err : 'Operation failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      disabled={loading}
      onClick={handleFollowClick}
      className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 ${
        isFollowing
          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700'
          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/10'
      }`}
    >
      {isFollowing ? (
        <>
          <UserMinus className="w-3.5 h-3.5" />
          <span>Unfollow</span>
        </>
      ) : (
        <>
          <UserPlus className="w-3.5 h-3.5" />
          <span>Follow Collection</span>
        </>
      )}
    </motion.button>
  );
}
