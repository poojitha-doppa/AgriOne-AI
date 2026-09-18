import { Router } from 'express';
import { evaluateSchemeEligibility, getAndhraPradeshSchemeAnswer } from '../services/schemeService.js';

const router = Router();

router.post('/chat', async (req, res) => {
  try {
    const question = String(req.body?.question || '').trim();

    if (!question) {
      return res.status(400).json({
        error: 'question is required',
      });
    }

    const result = await getAndhraPradeshSchemeAnswer(question);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to generate scheme response',
      details: error?.message || 'Unknown error',
    });
  }
});

router.post('/eligibility', async (req, res) => {
  try {
    const result = await evaluateSchemeEligibility(req.body || {});
    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to evaluate scheme eligibility',
      details: error?.message || 'Unknown error',
    });
  }
});

router.get('/health', (req, res) => {
  res.json({ status: 'ok', scope: 'India (National + State schemes)' });
});

export default router;
