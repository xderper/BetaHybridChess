import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'

// Маршруты, требующие авторизации
const protectedRoutes = [
    '/admin/dashboard',
    '/admin/areas',
    '/admin/users',
    '/admin/settings',
    '/profile'
]

// Маршруты, требующие роль админа
const adminRoutes = [
    '/admin/dashboard',
    '/admin/areas',
    '/admin/users',
    '/admin/settings'
]

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('token')?.value
    const pathname = request.nextUrl.pathname


    // Проверяем, является ли маршрут защищенным
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
    const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))


    if (!isProtectedRoute) {
        return NextResponse.next()
    }

    // Если нет токена, перенаправляем на страницу входа
    if (!token) {
        const loginUrl = isAdminRoute ? '/login/admin' : '/login/user'
        return NextResponse.redirect(new URL(loginUrl, request.url))
    }

    try {
        // Проверяем токен и получаем данные пользователя
        const userData = await verifyToken(token)
        // Проверяем права доступа для админских маршрутов
        if (isAdminRoute && userData.role !== 'admin') {
            const loginUrl = isAdminRoute ? '/login/admin' : '/login/user'
            return NextResponse.redirect(new URL(loginUrl, request.url))
        }

        return NextResponse.next()
    } catch (error) {
        // Если токен недействителен, перенаправляем на страницу входа
        const loginUrl = isAdminRoute ? '/login/admin' : '/login/user'
        return NextResponse.redirect(new URL(loginUrl, request.url))
    }
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}