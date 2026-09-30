import express from 'express';
import { 
  getUsers, 
  updateUser, 
  deleteUser, 
  followUser, 
  getUserProfile,
  getPublicAuthors,
  updateOwnProfile,
  becomeAuthor,
  toggleBookmark,
  getBookmarks,
  toggleNewsletter,
  toggleCategorySubscription,
  getDashboardStats,
  getEarningsReport,
  getLeaderboard,
  getMyGamification,
  getUserGamification,
  recordUserAction
} from '../controllers/userController';
import { auth, optionalAuth, requireRole } from '../middleware/auth';

const router = express.Router();

router.get('/search/authors', getPublicAuthors);
router.get('/:id/profile', optionalAuth, getUserProfile);
router.post('/:id/follow', auth, followUser);

// Profile, Bookmark, Role Upgrade and Newsletter Routes
router.get('/dashboard/stats', auth, getDashboardStats);
router.get('/gamification', auth, getMyGamification);
router.get('/:id/gamification', optionalAuth, getUserGamification);
router.post('/gamification/action', auth, recordUserAction);
router.put('/profile', auth, updateOwnProfile);
router.post('/become-author', auth, becomeAuthor);
router.get('/bookmarks', auth, getBookmarks);
router.post('/bookmarks/:blogId', auth, toggleBookmark);
router.post('/newsletter/:authorId', auth, toggleNewsletter);
router.post('/subscribe-category', auth, toggleCategorySubscription);

// Admin Only Routes
router.get('/', auth, requireRole(['admin']), getUsers);
router.get('/earnings-report', auth, requireRole(['admin']), getEarningsReport);
router.get('/leaderboard', optionalAuth, getLeaderboard);
router.put('/:id', auth, requireRole(['admin']), updateUser);
router.delete('/:id', auth, requireRole(['admin']), deleteUser);

export default router;
