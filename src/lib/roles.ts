import type { Profile } from '../types'

export type UserRole = Profile['role']

// Role hierarchy - higher index = more permissions
const ROLE_HIERARCHY: UserRole[] = ['employee', 'finance_editor', 'food_editor', 'admin']

/**
 * Check if a user has a specific role
 */
export function hasRole(profile: Profile | null, role: UserRole): boolean {
  if (!profile) return false
  return profile.role === role
}

/**
 * Check if a user is any type of admin
 */
export function isAdmin(profile: Profile | null): boolean {
  if (!profile) return false
  return ['admin', 'food_editor', 'finance_editor'].includes(profile.role)
}

/**
 * Check if a user is main admin (has full access)
 */
export function isMainAdmin(profile: Profile | null): boolean {
  if (!profile) return false
  return profile.role === 'admin'
}

/**
 * Check if a user can manage meals (admin or food_editor)
 */
export function canManageMeals(profile: Profile | null): boolean {
  if (!profile) return false
  return ['admin', 'food_editor'].includes(profile.role)
}

/**
 * Check if a user can manage finance/payments (admin or finance_editor)
 */
export function canManageFinance(profile: Profile | null): boolean {
  if (!profile) return false
  return ['admin', 'finance_editor'].includes(profile.role)
}

/**
 * Check if a user can manage users and assign roles (admin only)
 */
export function canManageUsers(profile: Profile | null): boolean {
  if (!profile) return false
  return profile.role === 'admin'
}

/**
 * Check if a user can manage bookings (admin only)
 * Food and finance editors can view but not approve/deny
 */
export function canManageBookings(profile: Profile | null): boolean {
  if (!profile) return false
  return profile.role === 'admin'
}

/**
 * Check if a user can view all bookings (any admin type)
 */
export function canViewAllBookings(profile: Profile | null): boolean {
  if (!profile) return false
  return isAdmin(profile)
}

/**
 * Check if a user can view reports
 */
export function canViewReports(profile: Profile | null): boolean {
  if (!profile) return false
  return isAdmin(profile)
}

/**
 * Check if a user has a role at least as high as the required role
 */
export function hasMinimumRole(profile: Profile | null, requiredRole: UserRole): boolean {
  if (!profile) return false
  const userRoleIndex = ROLE_HIERARCHY.indexOf(profile.role)
  const requiredRoleIndex = ROLE_HIERARCHY.indexOf(requiredRole)
  return userRoleIndex >= requiredRoleIndex
}

/**
 * Get the role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    'employee': 'Employee',
    'admin': 'Admin',
    'food_editor': 'Food Editor',
    'finance_editor': 'Finance Editor',
  }
  return displayNames[role] || role
}
