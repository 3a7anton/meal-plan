import { UtensilsCrossed, Clock, Users } from 'lucide-react'
import { Card, CardContent, Button, DietaryBadge } from '../ui'
import { formatTime, getCapacityIndicator } from '../../lib/utils'
import type { MenuScheduleWithMeal } from '../../types'

interface MealCardProps {
  schedule: MenuScheduleWithMeal
  onBook?: (scheduleId: string) => void
  isBooking?: boolean
  userHasBooking?: boolean
}

export function MealCard({ schedule, onBook, isBooking, userHasBooking }: MealCardProps) {
  const { meal, time_slot, remaining_capacity = 0, capacity } = schedule
  const capacityInfo = getCapacityIndicator(remaining_capacity)
  const isFull = remaining_capacity <= 0

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
            {meal.meal_type}
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

        {/* Dietary Tags */}
        {meal.dietary_tags && meal.dietary_tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {meal.dietary_tags.map((tag) => (
              <DietaryBadge key={tag} tag={tag} />
            ))}
          </div>
        )}

        {/* Time & Capacity */}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{formatTime(time_slot)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{remaining_capacity}/{capacity}</span>
          </div>
        </div>

        {/* Book Button */}
        {onBook && (
          <Button
            variant={isFull ? 'secondary' : 'primary'}
            className="w-full"
            onClick={() => onBook(schedule.id)}
            disabled={isFull || isBooking || userHasBooking}
            isLoading={isBooking}
          >
            {userHasBooking ? 'Already Booked' : isFull ? 'Full' : 'Book Meal'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
