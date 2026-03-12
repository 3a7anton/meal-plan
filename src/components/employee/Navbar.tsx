import { User } from 'lucide-react'
import { useAuthStore } from '../../store'
import { NotificationBell } from './NotificationBell'

export function Navbar() {
  const { profile } = useAuthStore()

  return (
    <header className="fixed top-0 right-0 left-64 h-16 bg-white border-b border-gray-200 z-20">
      <div className="h-full flex items-center justify-between px-6">
        <div>
          {/* Can add breadcrumbs or page title here */}
        </div>

        <div className="flex items-center gap-4">
          <NotificationBell />
          
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="h-9 w-9 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-primary-600" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{profile?.full_name}</p>
              <p className="text-xs text-gray-500 capitalize">{profile?.role}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
