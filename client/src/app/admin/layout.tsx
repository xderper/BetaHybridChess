import type { Metadata } from 'next'
import Link from 'next/link'
import '../globals.css'

export const metadata: Metadata = {
  title: 'Hybrid-Chess',
  description: 'Full-stack TypeScript application',
}

interface AdminLayoutProps {
  children: React.ReactNode
}

function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-lg sticky top-0 z-50">
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Link
                    href="/admin/dashboard"
                    className="text-xl font-bold text-white hover:text-gray-200 transition-colors duration-200"
                  >
                    ♟ Hybrid-Chess Admin
                  </Link>
                </div>
                <div className="flex items-center space-x-6">
                  <Link
                    href="/admin/dashboard"
                    className="text-gray-300 hover:text-white transition-colors duration-200 font-medium"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/"
                    className="text-gray-300 hover:text-white transition-colors duration-200 font-medium"
                  >
                    Back to Site
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div className="container mx-auto">
            <div className="admin-layout">
              {children}
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminLayout>
      {children}
    </AdminLayout>
  )
}
