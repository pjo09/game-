import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { GameManager } from './game/GameManager';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const corsOrigin = process.env.CORS_ORIGIN || process.env.CLIENT_URL || '*';

app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingInterval: 10000,
  pingTimeout: 5000,
});

const gameManager = new GameManager(io);

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  gameManager.handleConnection(socket);
});

httpServer.listen(Number(port), '0.0.0.0', () => {
  console.log(`🚀 HIDEOUT Server running on 0.0.0.0:${port}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Closing HTTP server.');
  httpServer.close(() => {
    process.exit(0);
  });
});
