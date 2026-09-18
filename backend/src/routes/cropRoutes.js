import { Router } from 'express';
import protect from '../middleware/authMiddleware.js';
import { uploadSingle } from '../middleware/uploadMiddleware.js';
import { analyzeCrop, getCropHistory } from '../controllers/cropController.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/analyze', protect, aiLimiter, uploadSingle, analyzeCrop);
router.get('/history', protect, getCropHistory);

export default router;
