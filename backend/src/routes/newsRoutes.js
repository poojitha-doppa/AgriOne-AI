import { Router } from 'express';
import { getNews } from '../controllers/newsController.js';
import protect from '../middleware/authMiddleware.js';

const router = Router();

// GET /api/news/headlines is handled by news.js (mounted first in app.js)
// This router only adds the protected GET /api/news/ endpoint
router.get('/', protect, getNews);

export default router;
