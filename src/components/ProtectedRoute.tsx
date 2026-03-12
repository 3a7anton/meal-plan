import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store'
import { Loading } from './ui'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'employee'
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const location = useLocation()
  const { user, profile, isLoading, isInitialized } = useAuthStore()

  // Show loading while checking auth state
  if (!isInitialized || isLoading) {
    return <Loading fullScreen text="Loading..." />
  }

  // Not authenticated - redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Waiting for profile to load — but only briefly after login
  // If profile is still null after auth is initialized, create a fallback
  if (!profile && user) {
    // Profile might not exist yet (trigger delay or failure)
    // Allow access with a default employee role
    const fallbackProfile = {
      id: user.id,
      email: user.email || '',
      full_name: user.email?.split('@')[0] || 'User',
      role: 'employee' as const,
      department: null,
      dietary_preferences: null,
      is_active: true,
      created_at: new Date().toISOString(),
    }

    // Check role if required
    if (requiredRole && fallbackProfile.role !== requiredRole) {
      return <Navigate to="/dashboard" replace />
    }

    return <>{children}</>
  }

  // Check role if required
  if (requiredRole && profile!.role !== requiredRole) {
    // Admins trying to access employee routes - allow
    if (requiredRole === 'employee' && profile!.role === 'admin') {
      return <>{children}</>
    }
    // Employees trying to access admin routes - redirect to dashboard
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
