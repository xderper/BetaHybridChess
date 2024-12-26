import { NextResponse, NextRequest } from 'next/server'
import dbConnect from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { Game } from '@/models/Game'

export async function GET() {
    try {
        await dbConnect()
        
        const games = await Game.find().sort({ createdAt: -1 })
        return NextResponse.json(games)
    } catch (error) {
        console.error('Error in /api/games:', error)
        return NextResponse.json(
            { error: 'Failed to fetch games' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        // Проверяем токен
        const token = request.cookies.get('token')?.value
        if (!token) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Проверяем права доступа
        const userData = await verifyToken(token)
        if (userData.role !== 'admin') {
            return NextResponse.json(
                { error: 'Access denied' },
                { status: 403 }
            )
        }

        await dbConnect()
        
        const roomId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
        const game = new Game({
            status: 'waiting',
            roomId,
            createdAt: new Date()
        })
        
        await game.save()
        return NextResponse.json(game)
    } catch (error) {
        console.error('Error creating game:', error)
        return NextResponse.json(
            { error: 'Failed to create game' },
            { status: 500 }
        )
    }
}

export async function DELETE(request: NextRequest) {
    try {
        // Проверяем токен
        const token = request.cookies.get('token')?.value
        if (!token) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Проверяем права доступа
        const userData = await verifyToken(token)
        if (userData.role !== 'admin') {
            return NextResponse.json(
                { error: 'Access denied' },
                { status: 403 }
            )
        }

        await dbConnect()
        
        const { searchParams } = new URL(request.url)
        const roomId = searchParams.get('id')
        
        if (!roomId) {
            return NextResponse.json(
                { error: 'Game ID is required' },
                { status: 400 }
            )
        }

        const result = await Game.findOneAndDelete({ roomId })
        
        if (!result) {
            return NextResponse.json(
                { error: 'Game not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting game:', error)
        return NextResponse.json(
            { error: 'Failed to delete game' },
            { status: 500 }
        )
    }
}
