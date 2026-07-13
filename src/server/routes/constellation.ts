import express from 'express';
import {
  getConstellations,
  createConstellation,
  generateAIConstellation
} from '../controllers/constellationController';
import { auth } from '../middleware/auth';

const router = express.Router();

router.get('/', getConstellations);
router.post('/', auth, createConstellation);
router.post('/generate', auth, generateAIConstellation);

export default router;
