'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'


interface LoginFormProps {
    role: 'user' | 'admin'
    redirectPath: string
}

export default function LoginForm({ role, redirectPath }: LoginFormProps) {
    const [credentials, setCredentials] = useState({ login: '', password: '' })
    const [error, setError] = useState('')
    const router = useRouter()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ...credentials, role }),
            })

            const data = await response.json()

            if (response.ok) {
                router.push(redirectPath)
            } else {
                setError(data.error || 'Login failed')
            }
        } catch (error) {
            setError('An unexpected error occurred')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center">
            <form onSubmit={handleLogin} className="space-y-4">
                <h2 className="text-2xl font-bold mb-4">
                    {role === 'admin' ? 'Admin Login' : 'User Login'}
                </h2>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        {error}
                    </div>
                )}

                <input
                    type="text"
                    placeholder="Login"
                    value={credentials.login}
                    onChange={(e) => setCredentials({ ...credentials, login: e.target.value })}
                    className="block w-full p-2 border rounded text-black"
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    className="block w-full p-2 border rounded text-black"
                />
                <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">
                    Login
                </button>
                {role === 'user' && (
                    <div className="text-center mt-4">
                        <Link
                            href="/register/user"
                            className="text-blue-500 hover:text-blue-600 font-medium">
                            Register
                        </Link>
                    </div>
                )}
            </form>
        </div>
    )
}