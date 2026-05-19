// backend/server.js
import app from './app.js';
import { createServer } from 'http';
import { Server } from 'socket.io';

const PORT = process.env.PORT || 8000;
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: 'http://localhost:3000', credentials: true }
});

// Map userId → socketId pour cibler un utilisateur précis
const connectedUsers = {};

io.on('connection', (socket) => {
  console.log('Un utilisateur connecté :', socket.id);

  socket.on('register', ({ userId, role }) => {
    // Rejoindre la room de son rôle (ex: "MANAGER", "AGENT", "CITIZEN")
    socket.join(role);
    socket.userId = userId;
    socket.role = role;
    connectedUsers[parseInt(userId)] = socket.id;
    console.log(`✅ User ${userId} (${role}) connecté — socket ${socket.id}`);
  });

  socket.on('disconnect', () => {
    if (socket.userId) delete connectedUsers[parseInt(socket.userId)];
    console.log('Utilisateur déconnecté :', socket.id);
  });
});

// ── Exporter io et connectedUsers pour les utiliser dans app.js ──────────────
export { io, connectedUsers };

httpServer.listen(PORT, () =>
  console.log(`🚀 Serveur ECOTRACK lancé sur http://localhost:${PORT}`)
);