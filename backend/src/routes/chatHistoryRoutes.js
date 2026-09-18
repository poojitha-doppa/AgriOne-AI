import { Router } from 'express';
import protect from '../middleware/authMiddleware.js';
import { listSessions, getSession, saveSession, deleteSession } from '../controllers/chatHistoryController.js';

const router = Router();

// All chat history endpoints require authentication
router.use(protect);

router.get('/sessions', listSessions);
router.get('/sessions/:sessionId', getSession);
router.post('/sessions', saveSession);
router.delete('/sessions/:sessionId', deleteSession);

export default router;
