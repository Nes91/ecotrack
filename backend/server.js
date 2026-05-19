import app from './app.js';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { setIO } from './socket.js';

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: 'http://localhost:3000', credentials: true }
});

setIO(io); // 👈 important

io.on('connection', (socket) => {
  socket.on('register', ({ userId, role }) => {
    socket.join(role);
    connectedUsers[parseInt(userId)] = socket.id;
  });

  socket.on('disconnect', () => {
    if (socket.userId) delete connectedUsers[parseInt(socket.userId)];
  });
});

httpServer.listen(process.env.PORT || 8000);