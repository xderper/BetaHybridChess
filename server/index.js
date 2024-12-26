const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// Configure CORS
app.use(cors({
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true
}));
app.use(express.json());

// Connect to MongoDB

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL,
        methods: ["GET", "POST"]
    }
});

// Store rooms in memory for real-time updates
const gameRooms = {};

// Debug function to log room state
function logRoomState(roomId) {
  // const room = gameRooms[roomId];
  // console.log('\nRoom State:', roomId);
  // console.log('White:', room?.white || 'empty');
  // console.log('Black:', room?.black || 'empty');
  // console.log('Status:', room?.status || 'no status');
  // console.log('Spectators:', room?.spectators?.length || 0);
  // console.log('------------------------');
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_game_room', (roomId) => {
    console.log(`\nJoin room ${roomId}`);
    console.log('Socket ID:', socket.id);

    // Get or create room
    let room = gameRooms[roomId];
    if (!room) {
      console.log('Creating new room');
      room = {
        white: null,
        black: null,
        spectators: [],
        status: 'waiting',
        moves: []
      };
      gameRooms[roomId] = room;
    }


    
    // Check if player is already in any role in this room
    if (room.white === socket.id || room.black === socket.id || room.spectators.includes(socket.id)) {
      console.log('Player already in room');
      // socket.emit('error', 'You are already in this room');
      // logRoomState(roomId);
      return;
    }

    // Check if the room has a game in progress
    if (room.white && room.black) {
      console.log('Room is full, joining as spectator');
      room.spectators.push(socket.id);
      socket.join(roomId);
      socket.roomId = roomId;
      socket.emit('game_status', { status: 'spectating' });
      logRoomState(roomId);
      return;
    }

    // Assign color
    let playerColor;
    if (!room.white) {
      console.log('Join as white');
      room.white = socket.id;
      playerColor = 'white';
    } else if (!room.black) {
      console.log('Join as black');
      room.black = socket.id;
      playerColor = 'black';
    }

    // Join room
    socket.join(roomId);
    socket.roomId = roomId;

    // Emit color assignment
    socket.emit('player_color', playerColor);

    // Emit room status to all players in the room
    io.to(roomId).emit('game_status', {
      white: Boolean(room.white),
      black: Boolean(room.black),
      status: room.white && room.black ? 'in_progress' : 'waiting'
    });

    logRoomState(roomId);
  });

  socket.on('move', ({ room: roomId, from, to, gameState, playerId }) => {
    // Broadcast move to other players in the room
    socket.to(roomId).emit('move', { from, to, gameState, playerId });
  });

  socket.on('leave_game_room', (roomId) => {
    const room = gameRooms[roomId];
    if (room) {
      // Remove player from room
      if (room.white === socket.id) {
        room.white = null;
      } else if (room.black === socket.id) {
        room.black = null;
      } else {
        room.spectators = room.spectators.filter(id => id !== socket.id);
      }

      // Delete room if empty
      if (!room.white && !room.black && room.spectators.length === 0) {
        delete gameRooms[roomId];
      }
    }
    socket.leave(roomId);
  });

  socket.on('disconnect', () => {
    console.log('\nUser disconnected:', socket.id);
    
    // Find and clean up the room this socket was in
    const roomId = socket.roomId;
    if (roomId && gameRooms[roomId]) {
      const room = gameRooms[roomId];
      
      if (room.white === socket.id) {
        console.log('White player disconnected');
        room.white = null;
      }
      if (room.black === socket.id) {
        console.log('Black player disconnected');
        room.black = null;
      }
      room.spectators = room.spectators.filter(id => id !== socket.id);

      // Notify remaining players
      io.to(roomId).emit('game_status', {
        white: Boolean(room.white),
        black: Boolean(room.black),
        status: 'waiting'
      });

      // Clean up empty rooms
      if (!room.white && !room.black && room.spectators.length === 0) {
        console.log('Removing empty room:', roomId);
        delete gameRooms[roomId];
      }

      logRoomState(roomId);
    }
  });
});



const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
