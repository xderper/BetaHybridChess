import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import dbConnect from '@/lib/db'
import User from '@/models/User'
import { verifyToken } from '@/lib/auth'

// Prevent static generation for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        await dbConnect()

        const token = request.cookies.get('token')?.value
        if (!token) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Verify token and check admin role
        const userData = await verifyToken(token)
        if (userData.role !== 'admin') {
            return NextResponse.json(
                { error: 'Access denied' },
                { status: 403 }
            )
        }

        // Get users list
        const users = await User.find({}, 'login role createdAt')
        return NextResponse.json(users)
    } catch (error) {
        console.error('Error fetching users:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}