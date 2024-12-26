import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null;
let connectionAttempts = 0;
const MAX_ATTEMPTS = 3;

export const connectSocket = () => {
    if (!socket) {
        socket = io('http://localhost:3001', {
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: MAX_ATTEMPTS,
            reconnectionDelay: 1000,
            timeout: 5000,
            autoConnect: false
        });

        // Add global error handlers
        socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            connectionAttempts++;
            
            if (connectionAttempts >= MAX_ATTEMPTS) {
                console.error('Max connection attempts reached');
                socket?.disconnect();
                socket = null;
                connectionAttempts = 0;
            }
        });

        socket.on('connect', () => {
            console.log('Socket connected successfully');
            connectionAttempts = 0;
        });

        socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
        });
    }

    if (socket && !socket.connected) {
        console.log('Attempting to connect socket...');
        socket.connect();
    }

    return socket;
}

export const getSocket = () => {
    return socket && socket.connected ? socket : null;
}
