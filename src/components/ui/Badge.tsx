import { cn } from '../../lib/utils'
import { useTranslation } from '../../hooks/useTranslation'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'pending' | 'confirmed' | 'denied' | 'cancelled' | 'success' | 'warning' | 'danger' | 'primary'
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
    primary: 'bg-primary-100 text-primary-800',
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
  const { t } = useTranslation()
  const statusVariant: Record<string, 'pending' | 'confirmed' | 'denied' | 'cancelled'> = {
    pending: 'pending',
    confirmed: 'confirmed',
    denied: 'denied',
    cancelled: 'cancelled',
  }

  return (
    <Badge variant={statusVariant[status] || 'default'}>
      {t(status)}
    </Badge>
  )
}
