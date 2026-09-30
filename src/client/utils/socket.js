import { io } from 'socket.io-client';

// Use window.location.origin so requests route seamlessly through Vite's proxy (port 5173)
// or standard production origin, eliminating any firewall blocks on port 5000 across the local network.
const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;

export const socket = io(socketUrl, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 15,
  reconnectionDelay: 1000,
  transports: ['websocket', 'polling']
});

export default socket;

