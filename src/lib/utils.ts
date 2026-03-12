import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

export function formatDateShort(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function isToday(date: Date | string): boolean {
  const today = new Date()
  const compareDate = new Date(date)
  return (
    today.getFullYear() === compareDate.getFullYear() &&
    today.getMonth() === compareDate.getMonth() &&
    today.getDate() === compareDate.getDate()
  )
}

export function isFuture(date: Date | string, time?: string): boolean {
  const now = new Date()
  const compareDate = new Date(date)
  
  if (time) {
    const [hours, minutes] = time.split(':')
    compareDate.setHours(parseInt(hours), parseInt(minutes))
  }
  
  return compareDate > now
}

export function canCancelBooking(date: Date | string, time: string): boolean {
  const now = new Date()
  const bookingTime = new Date(date)
  const [hours, minutes] = time.split(':')
  bookingTime.setHours(parseInt(hours), parseInt(minutes))
  
  // Can cancel if more than 1 hour before the meal time
  const oneHourBefore = new Date(bookingTime.getTime() - 60 * 60 * 1000)
  return now < oneHourBefore
}

export function getDietaryTagColor(tag: string): string {
  const colors: Record<string, string> = {
    vegetarian: 'bg-green-100 text-green-800',
    vegan: 'bg-emerald-100 text-emerald-800',
    halal: 'bg-blue-100 text-blue-800',
    kosher: 'bg-purple-100 text-purple-800',
    'gluten-free': 'bg-amber-100 text-amber-800',
    'dairy-free': 'bg-orange-100 text-orange-800',
    'nut-free': 'bg-red-100 text-red-800',
  }
  return colors[tag.toLowerCase()] || 'bg-gray-100 text-gray-800'
}

export function getStatusBadgeClass(status: string): string {
  const classes: Record<string, string> = {
    pending: 'badge-pending',
    confirmed: 'badge-confirmed',
    denied: 'badge-denied',
    cancelled: 'badge-cancelled',
  }
  return classes[status] || 'badge'
}

export function getCapacityIndicator(remaining: number): {
  color: string
  label: string
} {
  if (remaining <= 0) {
    return { color: 'text-red-600 bg-red-50', label: 'Full' }
  }
  if (remaining <= 3) {
    return { color: 'text-yellow-600 bg-yellow-50', label: `${remaining} left` }
  }
  return { color: 'text-green-600 bg-green-50', label: `${remaining} available` }
}
