import { Outlet } from 'react-router-dom'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  User,
  GraduationCap,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuthStore, useUIStore } from '../../store'
import { getRoleBadgeClasses, getRoleDisplayName } from '../../lib/roles'
import { cn } from '../../lib/utils'

// ─── Sidebar ────────────────────────────────────────────────────────────────

function StudentSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { signOut, profile } = useAuthStore()
  const { isMobileMenuOpen, closeMobileMenu } = useUIStore()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    closeMobileMenu()
  }, [location.pathname, closeMobileMenu])

  const handleSignOut = () => {
    navigate('/login')
    setTimeout(() => signOut(), 0)
  }

  const links = [
    { to: '/student/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/student/menu',      icon: UtensilsCrossed,  label: "Tomorrow's Menu" },
    { to: '/student/orders',    icon: ShoppingBag,       label: 'My Orders' },
  ]

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
          'fixed left-0 top-0 h-screen bg-white border-r border-amber-100 transition-all duration-300 z-40',
          'lg:translate-x-0',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
          isCollapsed ? 'lg:w-16 w-64' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-amber-500 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-gray-900 text-sm">MealPlanner</span>
                <p className="text-xs text-amber-600 font-medium">Student Portal</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-amber-50"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>

        {/* Profile pill */}
        {!isCollapsed && (
          <div className="mx-3 mt-3 mb-1 p-3 rounded-xl bg-amber-50 border border-amber-100">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-amber-800">
                  {profile?.full_name?.charAt(0)?.toUpperCase() || 'S'}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{profile?.full_name}</p>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-full',
                    profile?.role === 'student' ? 'bg-amber-100 text-amber-700' : getRoleBadgeClasses(profile?.role)
                  )}
                >
                  <GraduationCap className="h-3 w-3" />
                  {profile?.role === 'student' ? 'Student' : getRoleDisplayName(profile?.role)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/student/dashboard'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                  isActive
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'text-gray-600 hover:bg-amber-50/60 hover:text-gray-900'
                )
              }
            >
              <link.icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span className="font-medium">{link.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Sign Out */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-amber-100">
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

// ─── Navbar ─────────────────────────────────────────────────────────────────

function StudentNavbar() {
  const { profile } = useAuthStore()
  const { isMobileMenuOpen, toggleMobileMenu } = useUIStore()

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 h-16 bg-white border-b border-amber-100 z-20">
      <div className="h-full flex items-center justify-between px-4 sm:px-6">
        {/* Mobile Menu Button */}
        <button
          onClick={toggleMobileMenu}
          className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-amber-50"
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        <div />

        {/* User info */}
        <div className="flex items-center gap-2 sm:gap-3 pl-3 sm:pl-4 border-l border-amber-100">
          <div className="h-8 w-8 sm:h-9 sm:w-9 bg-amber-100 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900">{profile?.full_name}</p>
            <span
              className={cn(
                'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
                profile?.role === 'student' ? 'bg-amber-100 text-amber-700' : getRoleBadgeClasses(profile?.role)
              )}
            >
              <GraduationCap className="h-3 w-3" />
              {profile?.role === 'student' ? 'Student' : getRoleDisplayName(profile?.role)}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}

// ─── Layout ──────────────────────────────────────────────────────────────────

export function StudentLayout() {
  return (
    <div className="min-h-screen bg-amber-50/30">
      <StudentSidebar />
      <StudentNavbar />
      <main className="lg:ml-64 pt-16 min-h-screen">
        <div className="p-4 sm:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
