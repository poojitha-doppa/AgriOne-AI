import { Router } from 'express';
import { chatWithAssistant, sttFallback, ttsProxy } from '../controllers/aiAssistantController.js';
import { aiLimiter } from '../middleware/rateLimiter.js';
import { uploadSingle } from '../middleware/uploadMiddleware.js';
import protect from '../middleware/authMiddleware.js';

const router = Router();

router.post('/chat', protect, aiLimiter, uploadSingle, chatWithAssistant);
router.post('/stt', protect, aiLimiter, sttFallback);
router.post('/tts', protect, aiLimiter, ttsProxy);

export default router;
