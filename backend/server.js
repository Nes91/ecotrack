import app from './app.js';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { setIO, connectedUsers } from './socket.js';

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://ecotrack-five.vercel.app"
    ],
    credentials: true
  }
});

setIO(io);

io.on('connection', (socket) => {
  console.log("User connecté:", socket.id);

  socket.on('register', ({ userId, role }) => {
    socket.userId = userId;
    socket.join(role);

    connectedUsers[parseInt(userId)] = socket.id;
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      delete connectedUsers[parseInt(socket.userId)];
    }
  });
});

const PORT = process.env.PORT || 8000;

httpServer.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});