const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');

/**
 * Persistent Socket.IO server, attached to the HTTP server in server.js.
 * Clients authenticate over the handshake with their JWT, then are placed
 * into private rooms so the backend can push live events:
 *   - user:<userId>   -> one citizen gets their own complaint updates
 *   - role:official   -> officials hear new complaints for their work queue
 *   - role:admin      -> admins hear everything
 * Controllers import this module and call `emitToUser` / `emitToRole`.
 */
let io = null;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      credentials: process.env.NODE_ENV === 'production'
    }
  });

  // Authenticate every socket via the same JWT used by the REST API.
  io.use((socket, next) => {
    const token = (socket.handshake.auth && socket.handshake.auth.token)
      || (socket.handshake.headers && socket.handshake.headers.authorization && socket.handshake.headers.authorization.replace('Bearer ', ''));
    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'civicsense_jwt_secret');
      socket.user = {
        id: decoded.id,
        role: decoded.role,
        department: decoded.department || null
      };
      next();
    } catch (e) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const { id, role, department } = socket.user;

    // Private + role rooms for targeted broadcasts.
    socket.join(`user:${id}`);
    socket.join(`role:${role}`);
    if (department) socket.join(`dept:${department}`);

    socket.emit('connected', { userId: id, role });
    socket.on('subscribe', (complaintId) => socket.join(`complaint:${complaintId}`));

    socket.on('disconnect', () => { /* rooms auto-cleanup */ });
  });

  return io;
};

const getIO = () => io;

/** Notify a single user (e.g. the citizen who reported a complaint). */
const emitToUser = (userId, event, payload) => {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
};

/** Notify everyone with a given role. */
const emitToRole = (role, event, payload) => {
  if (!io) return;
  io.to(`role:${role}`).emit(event, payload);
};

/** Notify all officials whose department matches a complaint's department. */
const emitToDept = (department, event, payload) => {
  if (!io || !department) return;
  io.to(`dept:${department}`).emit(event, payload);
};

/** Notify everyone tracking one complaint (dashboard live views). */
const emitToComplaint = (complaintId, event, payload) => {
  if (!io) return;
  io.to(`complaint:${complaintId}`).emit(event, payload);
};

module.exports = { initSocket, getIO, emitToUser, emitToRole, emitToDept, emitToComplaint };