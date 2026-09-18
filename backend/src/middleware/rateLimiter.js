import rateLimit from 'express-rate-limit';

const isHealthRoute = (req) => req.path === '/api/health' || req.path === '/api/health/live';

const makeLimit = (windowMinutes, max, message, skip) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skip,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message,
        requestId: req.requestId,
      });
    },
  });

// Strict limit for auth endpoints — prevents brute force
export const authLimiter = makeLimit(15, 20, 'Too many login attempts. Try again in 15 minutes.');

// Moderate limit for AI-heavy endpoints
export const aiLimiter = makeLimit(15, 30, 'AI request limit reached. Try again in 15 minutes.');

// General fallback limit for everything else
export const generalLimiter = makeLimit(
  15,
  150,
  'Too many requests. Try again in 15 minutes.',
  isHealthRoute,
);
