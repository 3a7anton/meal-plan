import { UtensilsCrossed, Clock, Users } from 'lucide-react'
import { Card, CardContent, Button } from '../ui'
import { formatTime, toBengaliNumber } from '../../lib/utils'
import { useTranslation } from '../../hooks/useTranslation'
import type { MenuScheduleWithMeal } from '../../types'
import { BookingTimer } from './BookingTimer'
import { isBookingAllowed } from '../../store'

interface MealCardProps {
  schedule: MenuScheduleWithMeal
  onBook?: (scheduleId: string) => void
  isBooking?: boolean
  userHasBooking?: boolean
  bookingTimeLimit?: number // in minutes
}

export function MealCard({ 
  schedule, 
  onBook, 
  isBooking, 
  userHasBooking,
  bookingTimeLimit = 60 
}: MealCardProps) {
  const { meal, time_slot, remaining_capacity = 0, capacity, scheduled_date, price: schedulePrice } = schedule
  const { t, language } = useTranslation()
  const isBangla = language === 'bn'
  
  // Use schedule price if set, otherwise fall back to meal price
  const displayPrice = schedulePrice ?? meal.price ?? 0
  
  // Get capacity indicator with translation
  const getCapacityInfo = (remaining: number) => {
    const remainingBn = isBangla ? toBengaliNumber(remaining) : remaining
    if (remaining <= 0) {
      return { color: 'text-red-600 bg-red-50', label: t('full') }
    }
    if (remaining <= 3) {
      return { color: 'text-yellow-600 bg-yellow-50', label: `${remainingBn} ${t('left')}` }
    }
    return { color: 'text-green-600 bg-green-50', label: `${remainingBn} ${t('available')}` }
  }
  
  const capacityInfo = getCapacityInfo(remaining_capacity)
  const isFull = remaining_capacity <= 0
  const bookingAllowed = isBookingAllowed(scheduled_date, time_slot, bookingTimeLimit)

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="h-40 bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
        {meal.image_url ? (
          <img
            src={meal.image_url}
            alt={meal.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <UtensilsCrossed className="h-12 w-12 text-primary-300" />
        )}
      </div>

      <CardContent className="space-y-3">
        {/* Meal Type Badge */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-primary-600 uppercase tracking-wide">
            {t(meal.meal_type)}
          </span>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${capacityInfo.color}`}>
            {capacityInfo.label}
          </div>
        </div>

        {/* Name & Description */}
        <div>
          <h3 className="font-semibold text-gray-900">{meal.name}</h3>
          {meal.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{meal.description}</p>
          )}
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          {displayPrice > 0 ? (
            <span className="text-sm font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-md">
              ৳{isBangla ? toBengaliNumber(displayPrice) : displayPrice}
            </span>
          ) : (
            <span className="text-sm text-green-600 font-medium">{t('free')}</span>
          )}
        </div>

        {/* Time, Timer & Capacity */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4 text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{formatTime(time_slot)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>
                {isBangla ? toBengaliNumber(remaining_capacity) : remaining_capacity}/
                {isBangla ? toBengaliNumber(capacity) : capacity}
              </span>
            </div>
          </div>
          <BookingTimer 
            scheduledDate={scheduled_date} 
            timeSlot={time_slot} 
            bookingTimeLimit={bookingTimeLimit} 
          />
        </div>

        {/* Book Button */}
        {onBook && (
          <Button
            variant={isFull || !bookingAllowed ? 'secondary' : 'primary'}
            className="w-full"
            onClick={() => onBook(schedule.id)}
            disabled={isFull || isBooking || userHasBooking || !bookingAllowed}
            isLoading={isBooking}
          >
            {userHasBooking ? t('alreadyBooked') : 
             !bookingAllowed ? t('bookingClosed') :
             isFull ? t('full') : t('book')}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
