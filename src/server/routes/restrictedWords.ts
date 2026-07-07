import express from 'express';
import { getRestrictedWords, addRestrictedWord, deleteRestrictedWord } from '../controllers/restrictedWordController';
import { auth, requireRole } from '../middleware/auth';

const router = express.Router();

// Admin only routes for restricted words
router.get('/', auth, requireRole(['admin']), getRestrictedWords);
router.post('/', auth, requireRole(['admin']), addRestrictedWord);
router.delete('/:id', auth, requireRole(['admin']), deleteRestrictedWord);

export default router;
