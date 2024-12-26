import type { Metadata } from 'next'
import Link from 'next/link'
import '../globals.css'

export const metadata: Metadata = {
  title: 'Hybrid-Chess',
  description: 'Full-stack TypeScript application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <header className="bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-lg">
          <nav className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Link
                  href="/"
                  className="text-xl font-bold text-white"
                >
                  ♟ Hybrid-Chess
                </Link>
              </div>
              <div className="flex items-center space-x-6">
                <Link
                  href="/"
                  className="text-gray-300 hover:text-white transition-colors duration-200 font-medium"
                >
                  Home
                </Link>
                <Link
                  href="/profile"
                  className="text-gray-300 hover:text-white transition-colors duration-200 font-medium"
                >
                  Profile
                </Link>
              </div>
            </div>
          </nav>
        </header>
        <div className="min-h-screen bg-gray-900">
          {children}
        </div>
      </body>
    </html>
  )
}
