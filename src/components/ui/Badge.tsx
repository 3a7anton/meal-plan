import { cn } from '../../lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'pending' | 'confirmed' | 'denied' | 'cancelled' | 'success' | 'warning' | 'danger'
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    denied: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-600',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const statusVariant: Record<string, 'pending' | 'confirmed' | 'denied' | 'cancelled'> = {
    pending: 'pending',
    confirmed: 'confirmed',
    denied: 'denied',
    cancelled: 'cancelled',
  }

  return (
    <Badge variant={statusVariant[status] || 'default'}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}

interface DietaryBadgeProps {
  tag: string
}

export function DietaryBadge({ tag }: DietaryBadgeProps) {
  const colors: Record<string, string> = {
    vegetarian: 'bg-green-100 text-green-800',
    vegan: 'bg-emerald-100 text-emerald-800',
    halal: 'bg-blue-100 text-blue-800',
    kosher: 'bg-purple-100 text-purple-800',
    'gluten-free': 'bg-amber-100 text-amber-800',
    'dairy-free': 'bg-orange-100 text-orange-800',
    'nut-free': 'bg-red-100 text-red-800',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
        colors[tag.toLowerCase()] || 'bg-gray-100 text-gray-800'
      )}
    >
      {tag}
    </span>
  )
}
