import { io } from 'socket.io-client';

const SOCKET_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

let socket = null;

/**
 * Lazily create (and reuse) a Socket.IO connection authenticated with the
 * same JWT stored for the REST API. If the user logs out / token vanishes,
 * close the connection so no stale socket lingers.
 */
export const connectSocket = () => {
  const token = localStorage.getItem('cs_token');
  if (!token) return null;
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    auth: { token },
    reconnection: true,
    reconnectionDelay: 2000
  });

  socket.on('connect_error', () => {
    // Silent — the app degrades to polling/refresh if real-time is down.
    disconnectSocket();
  });

  return socket;
};

export const getSocket = () => (socket && socket.connected ? socket : connectSocket());

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/** Subscribe the caller to live updates for one complaint (e.g. its detail page). */
export const subscribeComplaint = (id) => {
  const s = getSocket();
  if (s) s.emit('subscribe', id);
};

export default connectSocket;