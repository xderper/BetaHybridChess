'use client'

import { useState, useEffect } from 'react'
import { connectSocket, getSocket } from '@/lib/socket'
import { useRouter } from 'next/navigation'
import styles from '../page.module.css'

export default function Home() {
  const [roomId, setRoomId] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()
  const [room, setRoom] = useState('')

  useEffect(() => {
    // Initialize socket connection
    const socket = connectSocket();

    return () => {
      // Clean up listeners but keep the connection
      socket.removeAllListeners();
    }
  }, []);

  const handleJoinGame = () => {
    if (!roomId.trim()) {
      setError('Please enter a room ID');
      return;
    }

    const socket = getSocket();
    if (!socket) {
      setError('Connection error');
      return;
    }

    console.log('Joining game room:', roomId);
    setError('');

    // Remove any existing listeners
    socket.removeAllListeners('player_color');
    socket.removeAllListeners('error');

    socket.emit('join_game_room', roomId);

    socket.once('player_color', (color: string) => {
      console.log('Received color:', color);
      router.push(`/game?roomId=${roomId}&color=${color}`);
    });

    socket.once('error', (message: string) => {
      console.error('Socket error:', message);
      setError(message);
    });
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>Chess Game</h1>
        <div className={styles.form}>
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Enter Room ID"
            className={styles.input}
          />
          <button onClick={handleJoinGame} className={styles.button}>
            Join Game
          </button>
        </div>
        {error && <p className={styles.error}>{error}</p>}
      </div>
    </main>
  )
}
