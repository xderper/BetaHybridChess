import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

interface GameRoom {
  white?: string;
  black?: string;
  spectators: string[];
  gameState?: string; // FEN notation of current game state
}

const gameRooms: Map<string, GameRoom> = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_game_room', (roomId: string) => {
    // Get or create room
    let room = gameRooms.get(roomId);
    if (!room) {
      room = { spectators: [], gameState: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' };
      gameRooms.set(roomId, room);
    }

    // Assign player color
    let playerColor: 'white' | 'black' | undefined;
    if (!room.white) {
      room.white = socket.id;
      playerColor = 'white';
    } else if (!room.black) {
      room.black = socket.id;
      playerColor = 'black';
    } else {
      room.spectators.push(socket.id);
    }

    // Join socket room
    socket.join(roomId);

    // Send player their color and current game state
    if (playerColor) {
      socket.emit('player_color', playerColor);
    }
    if (room.gameState) {
      socket.emit('game_state', room.gameState);
    }

    console.log(`Player ${socket.id} joined room ${roomId} as ${playerColor || 'spectator'}`);
  });

  socket.on('move', ({ room: roomId, from, to, newGameState }) => {
    console.log(`\nMove received in room ${roomId}:`);
    console.log('From:', from);
    console.log('To:', to);
    console.log('New game state:', newGameState);
    
    const room = gameRooms.get(roomId);
    if (!room) {
      console.error('Room not found:', roomId);
      socket.emit('move_error', { message: 'Game room not found' });
      return;
    }

    if (!newGameState) {
      console.error('No game state provided with move');
      socket.emit('move_error', { message: 'No game state provided with move' });
      return;
    }

    try {
      // Update game state
      room.gameState = newGameState;
      console.log('\nRoom state after move:');
      console.log('New game state:', room.gameState);

      // First, acknowledge the move to the sender
      socket.emit('move_accepted', {
        from,
        to,
        gameState: room.gameState
      });

      // Then broadcast move to other clients in the room
      socket.to(roomId).emit('move', {
        from,
        to,
        gameState: room.gameState,
        playerId: socket.id
      });
    } catch (error) {
      console.error('Error processing move:', error);
      socket.emit('move_error', { message: 'Error processing move' });
    }
  });

  socket.on('request_game_state', (roomId: string) => {
    console.log(`Game state requested for room ${roomId}`);
    const room = gameRooms.get(roomId);
    if (room && room.gameState) {
      console.log('Sending current game state:', room.gameState);
      socket.emit('game_state', room.gameState);
    } else {
      console.log('No game state available for room:', roomId);
    }
  });

  socket.on('leave_game_room', (roomId: string) => {
    const room = gameRooms.get(roomId);
    if (room) {
      // Remove player from room
      if (room.white === socket.id) {
        room.white = undefined;
      } else if (room.black === socket.id) {
        room.black = undefined;
      } else {
        room.spectators = room.spectators.filter(id => id !== socket.id);
      }

      // Delete room if empty
      if (!room.white && !room.black && room.spectators.length === 0) {
        gameRooms.delete(roomId);
      }
    }
    socket.leave(roomId);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Clean up any rooms the player was in
    gameRooms.forEach((room, roomId) => {
      if (room.white === socket.id || room.black === socket.id) {
        socket.to(roomId).emit('player_left');
      }
    });
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
