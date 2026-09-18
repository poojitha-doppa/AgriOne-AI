import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

import { config } from './config/env.js';
import requestIdMiddleware from './middleware/requestId.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import authRoutes from './routes/authRoutes.js';
import cropRoutes from './routes/cropRoutes.js';
import schemeRoutes from './routes/schemeRoutes.js';
import aiAssistantRoutes from './routes/aiAssistantRoutes.js';
import chatHistoryRoutes from './routes/chatHistoryRoutes.js';
import newsRouter from './routes/news.js';
import adminRoutes from './routes/adminRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// --- Security headers ---
app.use(helmet());

// --- CORS ---
app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) return cb(null, true);
    if (config.allowedOrigins.includes(origin)) return cb(null, true);
    // In development, allow all
    if (!config.isProduction) return cb(null, true);
    cb(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

// --- Request ID (attach before logging so it appears in logs) ---
app.use(requestIdMiddleware);

// --- Logging ---
app.use(morgan(config.isProduction ? 'combined' : 'dev'));

// --- Body parsing with size limits ---
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// --- General rate limit ---
app.use(generalLimiter);

// --- Static uploads ---
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Health endpoints ---
app.get('/api/health/live', (req, res) => {
  res.json({ status: 'ok', requestId: req.requestId });
});

app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState] ?? 'unknown';
  const isReady = dbState === 1;
  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ok' : 'degraded',
    liveness: 'ok',
    readiness: isReady ? 'ok' : 'degraded',
    db: dbStatus,
    env: config.nodeEnv,
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
  });
});

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/crop', cropRoutes);
app.use('/api/schemes', schemeRoutes);
app.use('/api/news', newsRouter);
app.use('/api/ai-assistant', aiAssistantRoutes);
app.use('/api/chat', chatHistoryRoutes);
app.use('/api/admin', adminRoutes);

// --- 404 ---
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    requestId: req.requestId,
  });
});

// --- Centralized error handler ---
app.use((err, req, res, _next) => {
  const status = err.status || 500;
  console.error(`[Error] ${status} ${err.message} | requestId=${req.requestId}`);
  res.status(status).json({
    success: false,
    message: config.isProduction && status === 500 ? 'Internal server error' : err.message,
    requestId: req.requestId,
  });
});

export default app;
