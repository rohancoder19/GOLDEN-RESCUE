import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import incidentsRouter from './routes/incidents.js';
import ambulancesRouter from './routes/ambulances.js';
import hospitalsRouter from './routes/hospitals.js';
import aiRouter from './routes/ai.js';
import analyticsRouter from './routes/analytics.js';
import auditRouter from './routes/audit.js';
import simulationRouter from './routes/simulation.js';
import { model } from './config/gemini.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// CORS Configuration
const allowedOrigin = process.env.CLIENT_URL || '*';
app.use(cors({
  origin: allowedOrigin === '*' ? '*' : [allowedOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.json({
    status: 'ONLINE',
    service: 'GOLDEN RESCUE OPERATIONAL ENGINE',
    version: '2.5.0-FUTURISTIC',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date(),
    connections: {
      database: isDbConnected ? 'CONNECTED' : 'DISCONNECTED',
      dbHost: mongoose.connection.host || 'none',
      geminiAiEngine: model ? 'ACTIVE (gemini-2.5-flash)' : 'FALLBACK_HEURISTIC_ACTIVE',
      socketIO: 'SYNCHRONIZED',
    },
  });
});

// Mount API Routes
app.use('/api/incidents', incidentsRouter);
app.use('/api/ambulances', ambulancesRouter);
app.use('/api/hospitals', hospitalsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/audit', auditRouter);
app.use('/api/simulation', simulationRouter);

// Serve Client Static Build if available
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// 404 handler for unmatched API routes
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.url}` });
});

// Global safe error handler - suppresses internal stacks in production
app.use((err, req, res, next) => {
  console.error('[App Error]', err);
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production' && status === 500
    ? 'An unexpected operational server error occurred.'
    : err.message || 'Internal Server Error';

  res.status(status).json({ success: false, error: message });
});

export default app;
