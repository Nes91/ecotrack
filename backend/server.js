import app from './app.js';
import { createServer } from 'http';
import { Server } from 'socket.io';

const PORT = process.env.PORT || 8000;
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'https://ecotrack-five.vercel.app'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const connectedUsers = {};

io.on('connection', (socket) => {
  console.log('Un utilisateur connecté :', socket.id);

  socket.on('register', ({ userId, role }) => {
    socket.join(role);
    socket.userId = userId;
    socket.role = role;
    connectedUsers[parseInt(userId)] = socket.id;
    console.log(`✅ User ${userId} connecté`);
  });

  socket.on('disconnect', () => {
    if (socket.userId) delete connectedUsers[parseInt(socket.userId)];
    console.log('Utilisateur déconnecté :', socket.id);
  });
});

httpServer.listen(PORT, '0.0.0.0', () =>
  console.log(`🚀 Serveur ECOTRACK lancé sur http://localhost:${PORT}`)
);

export { io, connectedUsers };