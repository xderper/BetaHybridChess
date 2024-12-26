'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { Chess } from 'chess.js';
import { connectSocket } from '@/lib/socket';
import { useSearchParams } from 'next/navigation';
import styles from './game.module.css';
import { default as dynamicImport } from 'next/dynamic';

// Import the Chessboard component with no SSR
const Chessboard = dynamicImport(
  () => import('react-chessboard').then((mod) => {
    const { Chessboard } = mod;
    return Chessboard;
  }),
  {
    ssr: false,
    loading: () => (
      <div className={styles.loadingBoard}>Loading Chess Board...</div>
    ),
  }
);

// Prevent static generation for this page
export const dynamic = 'force-dynamic';

// GameContent component that uses useSearchParams
function GameContent() {


  const [game, setGame] = useState<Chess>(new Chess());
  // const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white');
  const [status, setStatus] = useState('');
  const [pendingMove, setPendingMove] = useState<{ from: string; to: string } | null>(null);
  const socketRef = useRef<any>(null);
  const searchParams = useSearchParams();
  const roomId = searchParams.get('roomId');
  const playerColor = searchParams.get('color');

  useEffect(() => {
    if (!roomId) return;

    // Get the existing socket connection
    const socket = connectSocket();
    socketRef.current = socket;

    // Remove any existing listeners
    socket.removeAllListeners();

    // Handle connection events
    socket.on('connect', () => {
      console.log('Connected to game socket');
      socket.emit('join_game_room', roomId);
      console.log('Joining game room:', roomId);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from game socket');
      setStatus('Disconnected. Reconnecting...');
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setStatus('Connection error. Retrying...');
    });

    // Listen for player color assignment
    // socket.on('player_color', (color: 'white' | 'black') => {
    //   console.log('Received player color:', color);
    //   setPlayerColor(color);
    // });

    // Listen for game status updates
    socket.on('game_status', ({ status, white, black }) => {
      console.log('Game status update:', { status, white, black });
      
      if (status === 'spectating') {
        setStatus('You are spectating this game');
      } else if (status === 'waiting') {
        setStatus('Waiting for opponent...');
      } else if (status === 'in_progress') {
        setStatus('Game in progress');
      }
    });

    // Listen for move acceptance (for moves made by this client)
    socket.on('move_accepted', ({ from, to, gameState }) => {
      console.log('Move accepted by server:');
      console.log('From:', from);
      console.log('To:', to);
      console.log('Game state:', gameState);
      
      // Clear pending move since it was accepted
      setPendingMove(null);
      
      if (!gameState) {
        console.error('No game state received with move acceptance');
        socket.emit('request_game_state', roomId);
        return;
      }

      try {
        const newGame = new Chess();
        newGame.load(gameState);
        console.log('Successfully updated game state after move acceptance');
        console.log('New game FEN:', newGame.fen());
        setGame(newGame);
      } catch (error) {
        console.error('Failed to load game state from server:', gameState);
        socket.emit('request_game_state', roomId);
        return;
      }
    });

    // Listen for opponent's moves
    socket.on('move', ({ from, to, gameState, playerId }) => {
      console.log('Received opponent move:');
      console.log('From:', from);
      console.log('To:', to);
      console.log('Game state:', gameState);
      console.log('Player ID:', playerId);
      
      if (!gameState) {
        console.error('No game state received with opponent move');
        socket.emit('request_game_state', roomId);
        return;
      }

      try {
        const newGame = new Chess();
        newGame.load(gameState);
        console.log('Successfully updated game state from opponent move');
        console.log('New game FEN:', newGame.fen());
        setGame(newGame);
      } catch (error) {
        console.error('Error updating game state from opponent move:', error);
        socket.emit('request_game_state', roomId);
      }
    });

    // Listen for move errors
    socket.on('move_error', ({ message }) => {
      console.error('Move error:', message);
      // Clear pending move since it was rejected
      setPendingMove(null);
      socket.emit('request_game_state', roomId);
    });

    // Listen for game state updates
    socket.on('game_state', (gameState: string) => {
      console.log('Received game state update:');
      console.log('New state:', gameState);
      console.log('Current state:', game.fen());
      
      try {
        const newGame = new Chess(gameState);
        setGame(newGame);
      } catch (error) {
        console.error('Error updating game state:', error);
      }
    });

    // Listen for errors
    socket.on('error', (message: string) => {
      console.error('Socket error:', message);
      setStatus(`Error: ${message}`);
    });

    // If not connected, connect now
    if (!socket.connected) {
      socket.connect();
    } else {
      // If already connected, join the room immediately
      socket.emit('join_game_room', roomId);
    }

    return () => {
      console.log('Cleaning up game component');
      if (socketRef.current) {
        console.log('Leaving game room:', roomId);
        socketRef.current.emit('leave_game_room', roomId);
        socketRef.current.removeAllListeners();
      }
    };
  }, [roomId]);

  // Update game status
  useEffect(() => {
    if (game.isCheckmate()) {
      setStatus(`Checkmate! ${game.turn() === 'w' ? 'Black' : 'White'} wins!`);
    } else if (game.isDraw()) {
      setStatus('Draw!');
    } else if (game.isStalemate()) {
      setStatus('Stalemate!');
    } else if (game.isCheck()) {
      setStatus(`Check! ${game.turn() === 'w' ? 'White' : 'Black'} to move`);
    } else {
      setStatus(`${game.turn() === 'w' ? 'White' : 'Black'} to move`);
    }
  }, [game]);

  function onDrop(sourceSquare: string, targetSquare: string) {
    console.log('Attempting move:');
    console.log('From:', sourceSquare);
    console.log('To:', targetSquare);
    console.log('Current turn:', game.turn());
    console.log('Player color:', playerColor);
    console.log('Current FEN:', game.fen());

    // Only allow moves if it's the player's turn
    if (
      (game.turn() === 'w' && playerColor !== 'white') ||
      (game.turn() === 'b' && playerColor !== 'black')
    ) {
      console.log('Not player\'s turn');
      return false;
    }

    try {
      // Validate the move without updating state
      const gameCopy = new Chess(game.fen());
      const move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q'
      });

      if (move === null) {
        console.log('Invalid move');
        return false;
      }

      console.log('Move is valid, sending to server');
      
      if (socketRef.current) {
        const moveData = {
          room: roomId,
          from: sourceSquare,
          to: targetSquare,
          gameState: gameCopy.fen(),
          playerId: socketRef.current.id
        };
        console.log('\nEmitting move:', moveData);
        
        // Set pending move
        setPendingMove({ from: sourceSquare, to: targetSquare });
        
        // Update local state immediately for better UX
        setGame(gameCopy);
        
        // Send move to server
        socketRef.current.emit('move', moveData);
        
        return true;
      } else {
        console.error('Socket connection not available');
        return false;
      }
    } catch (error) {
      console.error('Error validating move:', error);
      return false;
    }
  }

  if (!roomId) {
    return <div className={styles.error}>Invalid room ID</div>;
  }

  return (
    <div className={styles.gameContainer}>
      <div className={styles.boardContainer}>
        <Chessboard
          id="BasicBoard"
          position={game.fen()}
          onPieceDrop={onDrop}
          boardOrientation={playerColor}
        />
      </div>
      <div className={styles.gameInfo}>
        <h2>Room: {roomId}</h2>
        <p>Playing as: {playerColor}</p>
        <p className={styles.status}>{status}</p>
      </div>
    </div>
  );
}

// Main Game component wrapped in Suspense
export default function Game() {
  return (
    <Suspense fallback={<div>Loading game...</div>}>
      <GameContent />
    </Suspense>
  );
}