import { Router } from 'express';
import { checkEligibility, findSchemes } from '../controllers/schemeController.js';
import protect from '../middleware/authMiddleware.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/eligibility', aiLimiter, checkEligibility);
router.post('/', protect, aiLimiter, findSchemes);

export default router;
