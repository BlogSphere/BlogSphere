import express from 'express';
import {
  createCommunity,
  getCommunities,
  joinCommunity,
  getCommunityDetails
} from '../controllers/communityController';
import { auth, optionalAuth } from '../middleware/auth';

const router = express.Router();

router.get('/', optionalAuth, getCommunities);
router.post('/', auth, createCommunity);
router.post('/:id/join', auth, joinCommunity);
router.get('/:id', optionalAuth, getCommunityDetails);

export default router;
