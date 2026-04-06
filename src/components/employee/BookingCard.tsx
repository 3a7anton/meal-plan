import { Calendar, Clock, X, RotateCcw } from 'lucide-react'
import { Card, CardContent, Button, StatusBadge } from '../ui'
import { formatDate, formatTime } from '../../lib/utils'
import type { BookingWithDetails } from '../../types'
import { isCancellationAllowed, getBookingTimeRemaining } from '../../store'

interface BookingCardProps {
  booking: BookingWithDetails
  onCancel?: (bookingId: string) => void
  onRefund?: (bookingId: string) => void
  isCancelling?: boolean
  isRefunding?: boolean
  cancellationTimeLimit?: number // in minutes
}

export function BookingCard({ 
  booking, 
  onCancel, 
  onRefund,
  isCancelling, 
  isRefunding,
  cancellationTimeLimit = 120 
}: BookingCardProps) {
  const { menu_schedule, status, booked_at } = booking
  const { meal, scheduled_date, time_slot } = menu_schedule

  const canCancel =
    (status === 'pending' || status === 'confirmed') &&
    isCancellationAllowed(scheduled_date, time_slot, cancellationTimeLimit)

  // Calculate time remaining for cancellation
  const timeRemaining = getBookingTimeRemaining(scheduled_date, time_slot, cancellationTimeLimit)
  const isRefundable = status === 'confirmed' && canCancel
  const isPendingOrConfirmed = status === 'pending' || status === 'confirmed'

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

        {/* Price */}
        {meal.price > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Meal cost</span>
            <span className="font-semibold text-primary-700">৳{meal.price}</span>
          </div>
        )}

        {/* Booked At */}
        <p className="text-xs text-gray-400">
          Booked on {new Date(booked_at).toLocaleDateString()}
        </p>

        {/* Cancel/Refund Buttons */}
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

        {/* Refund Button - only for confirmed bookings */}
        {onRefund && isRefundable && (
          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={() => onRefund(booking.id)}
            disabled={isRefunding}
            isLoading={isRefunding}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Request Refund
          </Button>
        )}

        {/* Time remaining for cancellation */}
        {isPendingOrConfirmed && !canCancel && (
          <p className="text-xs text-red-500 text-center">
            Cancellation window closed
          </p>
        )}
        {isPendingOrConfirmed && canCancel && timeRemaining.totalMinutes > 0 && (
          <p className="text-xs text-amber-600 text-center">
            Cancel within {timeRemaining.hours > 0 ? `${timeRemaining.hours}h ` : ''}{timeRemaining.minutes}m
          </p>
        )}
      </CardContent>
    </Card>
  )
}
