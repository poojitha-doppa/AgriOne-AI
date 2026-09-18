import { Router } from 'express';
import { signup, login, me } from '../controllers/authController.js';
import protect from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/signup', authLimiter, signup);
router.post('/login', authLimiter, login);
router.get('/me', protect, me);

export default router;
