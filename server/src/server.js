import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import app from './app.js';
import { connectDB } from './config/db.js';
import { setupSocket } from './sockets/socketHandler.js';
import { Ambulance } from './models/Ambulance.js';
import { seedInitialData } from './seed/seedData.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Setup Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

setupSocket(io);

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
