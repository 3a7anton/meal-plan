import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  CalendarDays, 
  Users, 
  FileBarChart,
  CreditCard,
  LogOut,
  ChevronLeft,
  ChevronRight,
  UserCircle,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuthStore, useUIStore } from '../../store'
import { cn } from '../../lib/utils'

interface SidebarProps {
  isAdmin?: boolean
}

export function Sidebar({ isAdmin = false }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { signOut } = useAuthStore()
  const { isMobileMenuOpen, closeMobileMenu } = useUIStore()
  const navigate = useNavigate()
  const location = useLocation()

  // Close mobile menu when route changes
  useEffect(() => {
    closeMobileMenu()
  }, [location.pathname, closeMobileMenu])

  const handleSignOut = () => {
    // Navigate immediately for instant feedback, then sign out
    navigate('/login')
    // Use setTimeout to allow navigation to start before async cleanup
    setTimeout(() => signOut(), 0)
  }

  const employeeLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/menu', icon: UtensilsCrossed, label: 'Menu' },
    { to: '/bookings', icon: CalendarDays, label: 'My Bookings' },
    { to: '/profile', icon: UserCircle, label: 'My Profile' },
  ]

  const adminLinks = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/menu', icon: UtensilsCrossed, label: 'Menu Management' },
    { to: '/admin/bookings', icon: CalendarDays, label: 'Bookings' },
    { to: '/admin/users', icon: Users, label: 'Users' },
    { to: '/admin/payments', icon: CreditCard, label: 'Payments' },
    { to: '/admin/reports', icon: FileBarChart, label: 'Reports' },
  ]

  const links = isAdmin ? adminLinks : employeeLinks

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={closeMobileMenu}
        />
      )}
      
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 z-40',
          'lg:translate-x-0',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
          isCollapsed ? 'lg:w-16 w-64' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="h-8 w-8 text-primary-600" />
              <span className="font-bold text-gray-900">MealPlanner</span>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/admin'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )
              }
            >
              <link.icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span className="font-medium">{link.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Sign Out */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-200">
          <button
            onClick={handleSignOut}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg w-full',
              'text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors'
            )}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span className="font-medium">Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
