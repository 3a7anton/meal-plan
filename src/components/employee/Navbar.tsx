import { User, Menu, X } from 'lucide-react'
import { useAuthStore, useUIStore } from '../../store'
import { NotificationBell } from './NotificationBell'

export function Navbar() {
  const { profile } = useAuthStore()
  const { isMobileMenuOpen, toggleMobileMenu } = useUIStore()

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 h-16 bg-white border-b border-gray-200 z-20">
      <div className="h-full flex items-center justify-between px-4 sm:px-6">
        {/* Mobile Menu Button */}
        <button
          onClick={toggleMobileMenu}
          className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        <div>
          {/* Can add breadcrumbs or page title here */}
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <NotificationBell />
          
          <div className="flex items-center gap-2 sm:gap-3 pl-3 sm:pl-4 border-l border-gray-200">
            <div className="h-8 w-8 sm:h-9 sm:w-9 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600" />
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
