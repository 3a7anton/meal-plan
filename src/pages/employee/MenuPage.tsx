import { useEffect, useState } from 'react'
import { format, addDays, subDays } from 'date-fns'
import { ChevronLeft, ChevronRight, UtensilsCrossed } from 'lucide-react'
import { useAuthStore, useMenuStore, useBookingStore } from '../../store'
import { Card, Button, Select, CardSkeleton } from '../../components/ui'
import { useTranslation } from '../../hooks/useTranslation'
import { MealCard } from '../../components/employee'
import { ConfirmDialog } from '../../components/ui/Modal'
import toast from 'react-hot-toast'

export function MenuPage() {
  const { user } = useAuthStore()
  const { schedules, fetchSchedules, isLoading } = useMenuStore()
  const { createBooking, bookings, fetchUserBookings } = useBookingStore()
  const { t } = useTranslation()
  
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [mealTypeFilter, setMealTypeFilter] = useState<string>('all')
  const [bookingScheduleId, setBookingScheduleId] = useState<string | null>(null)
  const [isBooking, setIsBooking] = useState(false)

  const formattedDate = format(selectedDate, 'yyyy-MM-dd')

  useEffect(() => {
    fetchSchedules(formattedDate)
    if (user) {
      fetchUserBookings(user.id)
    }
  }, [formattedDate, fetchSchedules, user, fetchUserBookings])

  const handlePrevDay = () => setSelectedDate(subDays(selectedDate, 1))
  const handleNextDay = () => setSelectedDate(addDays(selectedDate, 1))
  const handleToday = () => setSelectedDate(new Date())

  const handleBookMeal = async () => {
    if (!bookingScheduleId || !user) return

    setIsBooking(true)
    const result = await createBooking(bookingScheduleId, user.id)
    
    if (result.error) {
      toast.error(result.error.message)
    } else {
      toast.success('Meal booked successfully!')
      fetchSchedules(formattedDate)
    }
    
    setIsBooking(false)
    setBookingScheduleId(null)
  }

  const filteredSchedules = schedules.filter((schedule) => {
    if (mealTypeFilter === 'all') return true
    return schedule.meal?.meal_type === mealTypeFilter
  })

  const breakfastSchedules = filteredSchedules.filter((s) => s.meal?.meal_type === 'breakfast')
  const lunchSchedules = filteredSchedules.filter((s) => s.meal?.meal_type === 'lunch')
  const afternoonSnackSchedules = filteredSchedules.filter((s) => s.meal?.meal_type === 'afternoon_snack')
  const eveningSnackSchedules = filteredSchedules.filter((s) => s.meal?.meal_type === 'evening_snack')
  const dinnerSchedules = filteredSchedules.filter((s) => s.meal?.meal_type === 'dinner')

  // Check if user has booking at specific time slot
  const getUserBookingAtSlot = (date: string, timeSlot: string) => {
    return bookings.find(
      (b) =>
        b.menu_schedule?.scheduled_date === date &&
        b.menu_schedule?.time_slot === timeSlot &&
        (b.status === 'pending' || b.status === 'confirmed')
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('menu')}</h1>
          <p className="text-gray-500">Browse and book your meals</p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <Select
            options={[
              { value: 'all', label: t('all') },
              { value: 'breakfast', label: t('breakfast') },
              { value: 'lunch', label: t('lunch') },
              { value: 'afternoon_snack', label: t('Afternoon snack') },
              { value: 'evening_snack', label: t('Evening snack') },
              { value: 'dinner', label: t('dinner') },
            ]}
            value={mealTypeFilter}
            onChange={(e) => setMealTypeFilter(e.target.value)}
            className="w-48"
          />
        </div>
      </div>

      {/* Date Navigation */}
      <Card>
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" onClick={handlePrevDay}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </h2>
            {format(selectedDate, 'yyyy-MM-dd') !== format(new Date(), 'yyyy-MM-dd') && (
              <button
                onClick={handleToday}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                {t('todayMenu')}
              </button>
            )}
          </div>

          <Button variant="ghost" onClick={handleNextDay}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </Card>

      {/* Menu Content */}
      {isLoading && schedules.length === 0 ? (
        <div className="space-y-8">
          {/* Breakfast Section Skeleton */}
          {(mealTypeFilter === 'all' || mealTypeFilter === 'breakfast') && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">🌅</span> Breakfast
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </div>
            </section>
          )}
          {/* Lunch Section Skeleton */}
          {(mealTypeFilter === 'all' || mealTypeFilter === 'lunch') && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">☀️</span> Lunch
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </div>
            </section>
          )}
          {/* Afternoon Snack Section Skeleton */}
          {(mealTypeFilter === 'all' || mealTypeFilter === 'afternoon_snack') && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">🍵</span> Afternoon Snack
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </div>
            </section>
          )}
          {/* Evening Snack Section Skeleton */}
          {(mealTypeFilter === 'all' || mealTypeFilter === 'evening_snack') && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">🌆</span> Evening Snack
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </div>
            </section>
          )}
          {/* Dinner Section Skeleton */}
          {(mealTypeFilter === 'all' || mealTypeFilter === 'dinner') && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">🌙</span> Dinner
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </div>
            </section>
          )}
        </div>
      ) : filteredSchedules.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <UtensilsCrossed className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">{t('noMealsAvailable')}</h3>
            <p className="text-gray-500 mt-1">
              {t('noMealsScheduled')}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Breakfast Section */}
          {(mealTypeFilter === 'all' || mealTypeFilter === 'breakfast') && breakfastSchedules.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">🌅</span> Breakfast
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {breakfastSchedules.map((schedule) => {
                  const existingBooking = getUserBookingAtSlot(
                    schedule.scheduled_date,
                    schedule.time_slot
                  )
                  return (
                    <MealCard
                      key={schedule.id}
                      schedule={schedule}
                      onBook={(id) => setBookingScheduleId(id)}
                      userHasBooking={!!existingBooking}
                      bookingTimeLimit={schedule.booking_time_limit || 60}
                    />
                  )
                })}
              </div>
            </section>
          )}

          {/* Lunch Section */}
          {(mealTypeFilter === 'all' || mealTypeFilter === 'lunch') && lunchSchedules.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">☀️</span> Lunch
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {lunchSchedules.map((schedule) => {
                  const existingBooking = getUserBookingAtSlot(
                    schedule.scheduled_date,
                    schedule.time_slot
                  )
                  return (
                    <MealCard
                      key={schedule.id}
                      schedule={schedule}
                      onBook={(id) => setBookingScheduleId(id)}
                      userHasBooking={!!existingBooking}
                      bookingTimeLimit={schedule.booking_time_limit || 60}
                    />
                  )
                })}
              </div>
            </section>
          )}

          {/* Afternoon Snack Section */}
          {(mealTypeFilter === 'all' || mealTypeFilter === 'afternoon_snack') && afternoonSnackSchedules.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">🍵</span> Afternoon Snack
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {afternoonSnackSchedules.map((schedule) => {
                  const existingBooking = getUserBookingAtSlot(
                    schedule.scheduled_date,
                    schedule.time_slot
                  )
                  return (
                    <MealCard
                      key={schedule.id}
                      schedule={schedule}
                      onBook={(id) => setBookingScheduleId(id)}
                      userHasBooking={!!existingBooking}
                      bookingTimeLimit={schedule.booking_time_limit || 60}
                    />
                  )
                })}
              </div>
            </section>
          )}

          {/* Evening Snack Section */}
          {(mealTypeFilter === 'all' || mealTypeFilter === 'evening_snack') && eveningSnackSchedules.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">🌆</span> Evening Snack
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {eveningSnackSchedules.map((schedule) => {
                  const existingBooking = getUserBookingAtSlot(
                    schedule.scheduled_date,
                    schedule.time_slot
                  )
                  return (
                    <MealCard
                      key={schedule.id}
                      schedule={schedule}
                      onBook={(id) => setBookingScheduleId(id)}
                      userHasBooking={!!existingBooking}
                      bookingTimeLimit={schedule.booking_time_limit || 60}
                    />
                  )
                })}
              </div>
            </section>
          )}

          {/* Dinner Section */}
          {(mealTypeFilter === 'all' || mealTypeFilter === 'dinner') && dinnerSchedules.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">🌙</span> Dinner
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {dinnerSchedules.map((schedule) => {
                  const existingBooking = getUserBookingAtSlot(
                    schedule.scheduled_date,
                    schedule.time_slot
                  )
                  return (
                    <MealCard
                      key={schedule.id}
                      schedule={schedule}
                      onBook={(id) => setBookingScheduleId(id)}
                      userHasBooking={!!existingBooking}
                      bookingTimeLimit={schedule.booking_time_limit || 60}
                    />
                  )
                })}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Booking Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!bookingScheduleId}
        onClose={() => setBookingScheduleId(null)}
        onConfirm={handleBookMeal}
        title={t('confirmBooking')}
        message={t('confirmBookingMsg')}
        confirmText={t('book')}
        cancelText={t('cancel')}
        isLoading={isBooking}
      />
    </div>
  )
}
