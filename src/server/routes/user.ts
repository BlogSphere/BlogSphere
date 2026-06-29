import express from 'express';
import { 
  getUsers, 
  updateUser, 
  deleteUser, 
  followUser, 
  getUserProfile,
  updateOwnProfile,
  toggleBookmark,
  getBookmarks,
  toggleNewsletter,
  toggleCategorySubscription
} from '../controllers/userController';
import { auth, requireRole } from '../middleware/auth';

const router = express.Router();

router.get('/:id/profile', getUserProfile);
router.post('/:id/follow', auth, followUser);

// Profile, Bookmark and Newsletter Routes
router.put('/profile', auth, updateOwnProfile);
router.get('/bookmarks', auth, getBookmarks);
router.post('/bookmarks/:blogId', auth, toggleBookmark);
router.post('/newsletter/:authorId', auth, toggleNewsletter);
router.post('/subscribe-category', auth, toggleCategorySubscription);

// Admin Only Routes
router.get('/', auth, requireRole(['admin']), getUsers);
router.put('/:id', auth, requireRole(['admin']), updateUser);
router.delete('/:id', auth, requireRole(['admin']), deleteUser);

export default router;
