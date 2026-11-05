import { io } from 'socket.io-client';
import { BASE_URL } from './api';

const resolveSocketUrl = () => {
  const envSocket = process.env.REACT_APP_SOCKET_URL;
  if (envSocket && !envSocket.includes('example.com')) {
    if (envSocket.includes('cybercrime-backend.onrender.com')) {
      return envSocket.replace('cybercrime-backend.onrender.com', 'cybercrime-backend-buzn.onrender.com');
    }
    return envSocket;
  }
  return BASE_URL.replace(/\/api\/?$/, '');
};

const SOCKET_URL = resolveSocketUrl();

let socket = null;

export const connectSocket = (userId, isAdmin = false) => {
  if (socket?.connected) return socket;
  socket = io(SOCKET_URL, {
    auth: { token: localStorage.getItem('accessToken') },
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5
  });

  socket.on('connect', () => {
    console.log('Socket connected');
    if (userId) socket.emit('join-room', userId);
    if (isAdmin) socket.emit('join-admin');
  });

  socket.on('disconnect', () => console.log('Socket disconnected'));
  return socket;
};

export const disconnectSocket = () => { socket?.disconnect(); socket = null; };
export const getSocket = () => socket;

export const onNewComplaint  = (cb) => socket?.on('new-complaint',  cb);
export const onStatusUpdate  = (cb) => socket?.on('status-update',  cb);
export const onComplaintSubmitted = (cb) => socket?.on('complaint-submitted', cb);

export const offNewComplaint = (cb) => socket?.off('new-complaint',  cb);
export const offStatusUpdate = (cb) => socket?.off('status-update',  cb);
