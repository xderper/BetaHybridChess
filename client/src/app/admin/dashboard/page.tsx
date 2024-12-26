'use client'

import { useEffect, useState } from 'react'

interface Game {
    _id: string
    roomId: string
    status: string
    createdAt: string
}

export default function AdminDashboard() {
    const [games, setGames] = useState<Game[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [creating, setCreating] = useState(false)
    const [deletingGames, setDeletingGames] = useState<Set<string>>(new Set())
    const [buttonClicks, setButtonClicks] = useState(0)

    useEffect(() => {
        fetchGames()
    }, [buttonClicks])

    const fetchGames = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/games', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                cache: 'no-store'
            })
            
            if (!response.ok) {
                throw new Error('Failed to fetch games')
            }

            const data = await response.json()
            console.log('Fetched games:', data)
            setGames(data)
            setError('')
        } catch (error) {
            console.error('Error fetching games:', error)
            setError('Failed to load games')
            setGames([])
        } finally {
            setLoading(false)
        }
    }

    const handleCreateGame = async () => {
        if (creating) return
        
        try {
            setCreating(true)
            const response = await fetch('/api/games', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                throw new Error('Failed to create game')
            }

            setButtonClicks(prev => prev + 1) // Refresh the list
        } catch (error) {
            console.error('Error creating game:', error)
            setError('Failed to create game')
        } finally {
            setCreating(false)
        }
    }

    const handleDeleteGame = async (gameId: string) => {
        if (deletingGames.has(gameId)) return

        try {
            setDeletingGames(prev => new Set(prev).add(gameId))
            const response = await fetch(`/api/games?id=${gameId}`, {
                method: 'DELETE'
            })

            if (!response.ok) {
                throw new Error('Failed to delete game')
            }

            setButtonClicks(prev => prev + 1) // Refresh the list
        } catch (error) {
            console.error('Error deleting game:', error)
            setError('Failed to delete game')
        } finally {
            setDeletingGames(prev => {
                const next = new Set(prev)
                next.delete(gameId)
                return next
            })
        }
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
            
            {loading ? (
                <p>Loading...</p>
            ) : error ? (
                <p className="text-red-500">{error}</p>
            ) : (
                <div className="space-y-6">
                    {/* Games List */}
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold mb-2">Active Games</h2>
                        <div className="bg-gray-800 rounded-lg overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-700">
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Game ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Created At</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {games.map(game => (
                                        <tr key={game._id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-300">{game.roomId}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-300">{game.status}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                                                {new Date(game.createdAt).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => handleDeleteGame(game.roomId)}
                                                    disabled={deletingGames.has(game.roomId)}
                                                    className={`px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors ${deletingGames.has(game.roomId) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    {deletingGames.has(game.roomId) ? 'Deleting...' : 'Delete'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <button
                        onClick={handleCreateGame}
                        disabled={creating}
                        className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors ${creating ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {creating ? 'Creating...' : 'Create Game'}
                    </button>
                </div>
            )}
        </div>
    )
}