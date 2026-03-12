import { Calendar, Clock, X } from 'lucide-react'
import { Card, CardContent, Button, StatusBadge, DietaryBadge } from '../ui'
import { formatDate, formatTime, canCancelBooking } from '../../lib/utils'
import type { BookingWithDetails } from '../../types'

interface BookingCardProps {
  booking: BookingWithDetails
  onCancel?: (bookingId: string) => void
  isCancelling?: boolean
}

export function BookingCard({ booking, onCancel, isCancelling }: BookingCardProps) {
  const { menu_schedule, status, booked_at } = booking
  const { meal, scheduled_date, time_slot } = menu_schedule

  const canCancel =
    (status === 'pending' || status === 'confirmed') &&
    canCancelBooking(scheduled_date, time_slot)

  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-medium text-primary-600 uppercase tracking-wide">
              {meal.meal_type}
            </span>
            <h3 className="font-semibold text-gray-900 mt-1">{meal.name}</h3>
          </div>
          <StatusBadge status={status} />
        </div>

        {/* Description */}
        {meal.description && (
          <p className="text-sm text-gray-500 line-clamp-2">{meal.description}</p>
        )}

        {/* Dietary Tags */}
        {meal.dietary_tags && meal.dietary_tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {meal.dietary_tags.map((tag) => (
              <DietaryBadge key={tag} tag={tag} />
            ))}
          </div>
        )}

        {/* Date & Time */}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(scheduled_date)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{formatTime(time_slot)}</span>
          </div>
        </div>

        {/* Booked At */}
        <p className="text-xs text-gray-400">
          Booked on {new Date(booked_at).toLocaleDateString()}
        </p>

        {/* Cancel Button */}
        {onCancel && canCancel && (
          <Button
            variant="danger"
            size="sm"
            className="w-full"
            onClick={() => onCancel(booking.id)}
            disabled={isCancelling}
            isLoading={isCancelling}
          >
            <X className="h-4 w-4 mr-1" />
            Cancel Booking
          </Button>
        )}

        {/* Cannot cancel message */}
        {(status === 'pending' || status === 'confirmed') && !canCancel && (
          <p className="text-xs text-gray-400 text-center">
            Cancellation deadline passed (1 hour before meal time)
          </p>
        )}
      </CardContent>
    </Card>
  )
}
