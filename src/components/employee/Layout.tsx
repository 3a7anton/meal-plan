import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'
import { useAuthStore } from '../../store'
import { isAdmin } from '../../lib/roles'

interface LayoutProps {
  isAdmin?: boolean
}

export function Layout({ isAdmin: isAdminRoute = false }: LayoutProps) {
  const { profile } = useAuthStore()
  const shouldShowAdmin = isAdminRoute && isAdmin(profile)

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isAdmin={shouldShowAdmin} />
      <Navbar />
      <main className="lg:ml-64 pt-16 min-h-screen">
        <div className="p-4 sm:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
