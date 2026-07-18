import express from 'express';
import {
  createCollection,
  getCollections,
  getCollectionBySlug,
  updateCollection,
  deleteCollection,
  addBlogToCollection,
  removeBlogFromCollection,
  reorderCollectionItems,
  followCollection,
  unfollowCollection,
  getUserCollections,
  getCollectionFollowers,
  getCollectionsContainingBlog,
  searchCollections,
  getTrendingCollections,
  getCollectionById,
  syncNotes
} from '../controllers/collectionController';
import { auth, optionalAuth } from '../middleware/auth';

const router = express.Router();

// Public / Optional Auth
router.get('/', optionalAuth, getCollections as any);
router.get('/trending', optionalAuth, getTrendingCollections as any);
router.get('/search', optionalAuth, searchCollections as any);
router.get('/blog/:blogId', optionalAuth, getCollectionsContainingBlog as any);
router.get('/user/me', auth, getUserCollections as any); // Put user/me BEFORE :slug so it doesn't match as a slug!
router.get('/:slug', optionalAuth, getCollectionBySlug as any);
router.get('/:slug/followers', optionalAuth, getCollectionFollowers as any);

// Auth Required
router.post('/', auth, createCollection as any);
router.get('/detail-by-id/:id', auth, getCollectionById as any);
router.put('/:id/sync-notes', auth, syncNotes as any);
router.put('/:id', auth, updateCollection as any);
router.delete('/:id', auth, deleteCollection as any);
router.post('/:id/items', auth, addBlogToCollection as any);
router.delete('/:id/items/:blogId', auth, removeBlogFromCollection as any);
router.put('/:id/reorder', auth, reorderCollectionItems as any);
router.post('/:id/follow', auth, followCollection as any);
router.delete('/:id/follow', auth, unfollowCollection as any);

export default router;
