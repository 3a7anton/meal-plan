import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store'
import { Loading } from './ui'
import { isAdmin, canManageMeals, canManageFinance, canManageUsers, canManageBookings } from '../lib/roles'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'employee'
  // New granular permission checks
  requireAnyAdmin?: boolean
  requireMainAdmin?: boolean
  requireFoodEditor?: boolean
  requireFinanceEditor?: boolean
  requireMealManagement?: boolean
  requireFinanceManagement?: boolean
  requireUserManagement?: boolean
  requireBookingManagement?: boolean
}

export function ProtectedRoute({ 
  children, 
  requiredRole,
  requireAnyAdmin,
  requireMainAdmin,
  requireFoodEditor,
  requireFinanceEditor,
  requireMealManagement,
  requireFinanceManagement,
  requireUserManagement,
  requireBookingManagement,
}: ProtectedRouteProps) {
  const location = useLocation()
  const { user, profile, isInitialized } = useAuthStore()

  // Show minimal loading only during initial auth check
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading size="sm" />
      </div>
    )
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
      is_active: true,
      created_at: new Date().toISOString(),
    }

    // Check role if required (legacy check)
    if (requiredRole && fallbackProfile.role !== requiredRole) {
      // If admin is required but fallback is employee, redirect
      if (requiredRole === 'admin') {
        return <Navigate to="/dashboard" replace />
      }
    }

    // Check new granular permissions - fallback profile is employee, so only allow employee routes
    if (requireAnyAdmin || requireMainAdmin || requireFoodEditor || requireFinanceEditor ||
        requireMealManagement || requireFinanceManagement || requireUserManagement || requireBookingManagement) {
      return <Navigate to="/dashboard" replace />
    }

    return <>{children}</>
  }

  // Legacy role check (for backward compatibility)
  if (requiredRole && profile!.role !== requiredRole) {
    // Admins trying to access employee routes - allow
    if (requiredRole === 'employee' && isAdmin(profile)) {
      return <>{children}</>
    }
    // Employees trying to access admin routes - redirect to dashboard
    if (requiredRole === 'admin' && !isAdmin(profile)) {
      return <Navigate to="/dashboard" replace />
    }
    // If admin role specifically required and user is admin (any type), allow
    if (requiredRole === 'admin' && isAdmin(profile)) {
      return <>{children}</>
    }
  }

  // New granular permission checks
  if (requireAnyAdmin && !isAdmin(profile)) {
    return <Navigate to="/dashboard" replace />
  }

  if (requireMainAdmin && profile!.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  if (requireFoodEditor && !['food_editor', 'admin'].includes(profile!.role)) {
    return <Navigate to="/dashboard" replace />
  }

  if (requireFinanceEditor && !['finance_editor', 'admin'].includes(profile!.role)) {
    return <Navigate to="/dashboard" replace />
  }

  if (requireMealManagement && !canManageMeals(profile)) {
    return <Navigate to="/dashboard" replace />
  }

  if (requireFinanceManagement && !canManageFinance(profile)) {
    return <Navigate to="/dashboard" replace />
  }

  if (requireUserManagement && !canManageUsers(profile)) {
    return <Navigate to="/dashboard" replace />
  }

  if (requireBookingManagement && !canManageBookings(profile)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
