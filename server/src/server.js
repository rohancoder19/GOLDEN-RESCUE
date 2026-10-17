import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import app from './app.js';
import { connectDB } from './config/db.js';
import { setupSocket } from './sockets/socketHandler.js';
import { Ambulance } from './models/Ambulance.js';
import { seedInitialData } from './seed/seedData.js';
import { seedDemoAccountsIfEmpty } from './routes/auth.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Setup Socket.IO with CORS
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

setupSocket(io);

// Graceful shutdown handling
let isShuttingDown = false;
async function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`\n[Server] 🛑 Received ${signal}. Initiating graceful shutdown...`);

  // Close HTTP server & stop accepting new connections
  server.close(() => {
    console.log('[Server] 🔌 HTTP server closed.');
  });

  try {
    io.close(() => {
      console.log('[Server] ⚡ Socket.IO engine closed.');
    });
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('[Server] 📦 MongoDB disconnected cleanly.');
    }
  } catch (err) {
    console.error('[Server] Error during shutdown:', err);
  } finally {
    process.exit(0);
  }
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Connect DB & auto-seed if needed
async function startServer() {
  await connectDB();

  // Check if collection is empty, then seed
  try {
    const ambCount = await Ambulance.countDocuments();
    if (ambCount === 0) {
      console.log('[Server] 🚀 Empty database detected. Populating initial operational data...');
      await seedInitialData();
    }
    await seedDemoAccountsIfEmpty();
  } catch (err) {
    console.warn('[Server] Seed check error:', err.message);
  }

  server.listen(PORT, () => {
    console.log(`
╔═════════════════════════════════════════════════════════════════════╗
║                     GOLDEN RESCUE OPERATIONAL CORE                  ║
║         "Every Second Matters. Every Decision Saves Time."          ║
╠═════════════════════════════════════════════════════════════════════╣
║  📡 Server Active:  http://localhost:${PORT}                           ║
║  🧠 Gemini 2.5 Flash Triage Engine: ACTIVE                          ║
║  ⚡ WebSockets & Telemetry Hub: ACTIVE                               ║
║  🏥 Regional Trauma Network: CONNECTED                              ║
╚═════════════════════════════════════════════════════════════════════╝
    `);
  });
}

startServer().catch((err) => {
  console.error('[Server Fatal] Failed to start server:', err);
});
