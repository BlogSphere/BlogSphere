import express from 'express';
import { getNotifications, markAsRead } from '../controllers/notificationController';
import { auth } from '../middleware/auth';

const router = express.Router();

router.get('/', auth, getNotifications);
router.put('/:id/read', auth, markAsRead);

export default router;
