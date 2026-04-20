import { Calendar, Clock, X } from 'lucide-react'
import { Card, CardContent, Button, StatusBadge } from '../ui'
import { formatDate, formatTime, toBengaliNumber } from '../../lib/utils'
import { useTranslation } from '../../hooks/useTranslation'
import type { BookingWithDetails } from '../../types'
import { isCancellationAllowed, getBookingTimeRemaining } from '../../store'

interface BookingCardProps {
  booking: BookingWithDetails
  onCancel?: (bookingId: string) => void
  onView?: (booking: BookingWithDetails) => void
  isCancelling?: boolean
  cancellationTimeLimit?: number // in minutes
  clickable?: boolean
}

export function BookingCard({ 
  booking, 
  onCancel, 
  onView,
  isCancelling, 
  cancellationTimeLimit = 120,
  clickable = true
}: BookingCardProps) {
  const { menu_schedule, status, booked_at, quantity } = booking
  const { meal, scheduled_date, time_slot, price: schedulePrice } = menu_schedule
  const { t, language } = useTranslation()
  const isBangla = language === 'bn'
  
  // Use schedule price if set, otherwise fall back to meal price
  const displayPrice = schedulePrice ?? meal.price ?? 0
  const bookingQuantity = quantity || 1

  const canCancel =
    (status === 'pending' || status === 'confirmed') &&
    isCancellationAllowed(scheduled_date, time_slot, cancellationTimeLimit)

  // Calculate time remaining for cancellation
  const timeRemaining = getBookingTimeRemaining(scheduled_date, time_slot, cancellationTimeLimit)
  const isPendingOrConfirmed = status === 'pending' || status === 'confirmed'

  const handleClick = () => {
    if (clickable && onView) {
      onView(booking)
    }
  }

  return (
    <Card 
      className={`overflow-hidden ${clickable ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={handleClick}
    >
      <CardContent className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-medium text-primary-600 uppercase tracking-wide">
              {t(meal.meal_type)}
            </span>
            <h3 className="font-semibold text-gray-900 mt-1">
              {meal.name}
              {bookingQuantity > 1 && (
                <span className="ml-2 text-sm font-normal text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                  ×{isBangla ? toBengaliNumber(bookingQuantity) : bookingQuantity}
                </span>
              )}
            </h3>
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
        {displayPrice > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">
              {t('mealCost')}
              {bookingQuantity > 1 && (
                <span className="text-gray-400 ml-1">(×{bookingQuantity})</span>
              )}
            </span>
            <span className="font-semibold text-primary-700">
              ৳{isBangla ? toBengaliNumber(displayPrice * bookingQuantity) : (displayPrice * bookingQuantity)}
            </span>
          </div>
        )}

        {/* Booked At */}
        <p className="text-xs text-gray-400">
          {t('bookedOn')} {new Date(booked_at).toLocaleDateString()}
        </p>

        {/* Cancel/Refund Buttons */}
        {onCancel && canCancel && (
          <Button
            variant="danger"
            size="sm"
            className="w-full"
            onClick={(e) => {
              e.stopPropagation()
              onCancel(booking.id)
            }}
            disabled={isCancelling}
            isLoading={isCancelling}
          >
            <X className="h-4 w-4 mr-1" />
            {t('cancelBooking')}
          </Button>
        )}

        {/* Time remaining for cancellation */}
        {isPendingOrConfirmed && !canCancel && (
          <p className="text-xs text-red-500 text-center">
            {t('cancellationWindowClosed')}
          </p>
        )}
        {isPendingOrConfirmed && canCancel && timeRemaining.totalMinutes > 0 && (
          <p className="text-xs text-amber-600 text-center">
            {t('cancelWithin')} {timeRemaining.hours > 0 ? `${timeRemaining.hours}${t('hourShort')} ` : ''}{timeRemaining.minutes}{t('minuteShort')}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
