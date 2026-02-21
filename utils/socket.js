const { Server } = require('socket.io');
const { CLIENT_URL } = require('../config/env');

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: CLIENT_URL,
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    socket.on('join-tenant', (tenantId) => {
      socket.join(`tenant:${tenantId}`);
    });

    socket.on('leave-tenant', (tenantId) => {
      socket.leave(`tenant:${tenantId}`);
    });

    socket.on('disconnect', () => {});
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

const emitToTenant = (tenantId, event, data) => {
  if (io) {
    io.to(`tenant:${tenantId}`).emit(event, data);
  }
};

module.exports = { initSocket, getIO, emitToTenant };
