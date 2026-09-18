import axios from 'axios';
import { generateAgricultureAssistantReply } from '../services/aiAssistantService.js';

const parseJsonSafe = (value, fallback = {}) => {
  if (!value) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export const chatWithAssistant = async (req, res) => {
  try {
    const body = req.body || {};
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const prompt = body.prompt || message;
    const requestedLanguage = String(body.language || 'en').toLowerCase();
    const language = ['en', 'te', 'hi', 'ta', 'kn'].includes(requestedLanguage) ? requestedLanguage : 'en';
    const weatherHint = body.weatherHint || '';
    const history = Array.isArray(body.history) ? body.history : parseJsonSafe(body.history, []);

    if (!message && !req.file) {
      return res.status(400).json({
        success: false,
        message: 'message is required',
        requestId: req.requestId,
      });
    }

    if (message.length > 2000) {
      return res.status(422).json({
        success: false,
        message: 'message must be 2000 characters or less',
        requestId: req.requestId,
      });
    }

    if (!Array.isArray(history) || history.length > 30) {
      return res.status(422).json({
        success: false,
        message: 'history must be an array with up to 30 items',
        requestId: req.requestId,
      });
    }

    const fileMeta = req.file
      ? {
          filename: req.file.filename,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
        }
      : null;

    const reply = await generateAgricultureAssistantReply({
      prompt,
      language,
      weatherHint,
      fileMeta,
      history,
    });

    return res.json({
      success: true,
      requestId: req.requestId,
      data: reply,
    });
  } catch (err) {
    console.error('[AI Assistant] chat error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Unable to process AI request',
      requestId: req.requestId,
    });
  }
};

export const sttFallback = async (_req, res) => {
  return res.status(501).json({
    success: false,
    message: 'Backend STT not configured. Use browser Speech Recognition.',
  });
};

/**
 * TTS proxy — calls Google Translate TTS server-side to avoid browser CORS restrictions.
 * Supports Telugu (te), Hindi (hi), Tamil (ta), Kannada (kn), English (en).
 * Accepts one chunk of text per request (max 200 chars). Frontend chains multiple calls for longer text.
 */
export const ttsProxy = async (req, res) => {
  const { text, language } = req.body || {};

  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ success: false, message: 'text is required' });
  }

  const langMap = { te: 'te', hi: 'hi', ta: 'ta', kn: 'kn', en: 'en' };
  const langCode = langMap[language] || 'en';
  const chunk = text.trim().slice(0, 200);

  try {
    const response = await axios.get('https://translate.google.com/translate_tts', {
      params: {
        ie: 'UTF-8',
        tl: langCode,
        client: 'tw-ob',
        q: chunk,
      },
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        'Referer': 'https://translate.google.com/',
        'Accept': 'audio/mpeg,audio/*',
      },
      timeout: 12000,
    });

    res.set({
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'no-store',
    });
    return res.send(Buffer.from(response.data));
  } catch (err) {
    console.error('[TTS] Google proxy failed:', err.message);
    return res.status(503).json({ success: false, message: 'TTS service temporarily unavailable' });
  }
};
