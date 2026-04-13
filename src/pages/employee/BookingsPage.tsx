import { useEffect, useState } from 'react'
import { CalendarDays, RotateCcw } from 'lucide-react'
import { useAuthStore, useBookingStore, useSettingsStore } from '../../store'
import { Card, CardContent, Select, CardSkeleton } from '../../components/ui'
import { BookingCard } from '../../components/employee'
import { useTranslation } from '../../hooks/useTranslation'
import { ConfirmDialog } from '../../components/ui/Modal'
import toast from 'react-hot-toast'

export function BookingsPage() {
  const { user } = useAuthStore()
  const { bookings, fetchUserBookings, cancelBooking, isLoading } = useBookingStore()
  const { cancellationTimeLimit, fetchSettings } = useSettingsStore()
  const { t } = useTranslation()
  
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null)
  const [refundingBookingId, setRefundingBookingId] = useState<string | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isRefunding, setIsRefunding] = useState(false)

  useEffect(() => {
    if (user) {
      fetchUserBookings(user.id)
      fetchSettings()
    }
  }, [user, fetchUserBookings, fetchSettings])

  const handleCancelBooking = async () => {
    if (!cancellingBookingId) return

    setIsCancelling(true)
    const result = await cancelBooking(cancellingBookingId)
    
    if (result.error) {
      toast.error(result.error.message)
    } else {
      toast.success(t('mealReturned'))
    }
    
    setIsCancelling(false)
    setCancellingBookingId(null)
  }

  const handleRefundBooking = async () => {
    if (!refundingBookingId) return

    setIsRefunding(true)
    const result = await cancelBooking(refundingBookingId)
    
    if (result.error) {
      toast.error(result.error.message)
    } else {
      toast.success(t('refundRequested'))
    }
    
    setIsRefunding(false)
    setRefundingBookingId(null)
  }

  const filteredBookings = bookings.filter((booking) => {
    if (statusFilter === 'all') return true
    return booking.status === statusFilter
  })

  const upcomingBookings = filteredBookings.filter(
    (b) => b.status === 'pending' || b.status === 'confirmed'
  )
  
  const pastBookings = filteredBookings.filter(
    (b) => b.status === 'denied' || b.status === 'cancelled'
  )

  // Calculate monthly total cost of confirmed bookings
  const currentMonth = new Date().toISOString().slice(0, 7) // 'YYYY-MM'
  const monthlyTotal = bookings
    .filter((b) => {
      const bookingMonth = b.booked_at?.slice(0, 7)
      return b.status === 'confirmed' && bookingMonth === currentMonth
    })
    .reduce((sum, b) => sum + ((b.menu_schedule?.meal as any)?.price || 0), 0)

  const isInitialLoading = isLoading && bookings.length === 0

  if (isInitialLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('bookings')}</h1>
          <p className="text-gray-500">Manage your meal reservations</p>
        </div>

        {/* Filters */}
        <Select
          options={[
            { value: 'all', label: t('all') },
            { value: 'pending', label: t('pending') },
            { value: 'confirmed', label: t('confirmed') },
            { value: 'denied', label: t('denied') },
            { value: 'cancelled', label: t('cancelled') },
          ]}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-40"
        />
      </div>

      {/* Monthly Cost Summary */}
      {monthlyTotal > 0 && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-primary-700">{t('monthlyTotal')}</p>
            <p className="text-xs text-primary-500">{t('confirmedBookings')}</p>
          </div>
          <p className="text-2xl font-bold text-primary-700">৳{monthlyTotal.toFixed(0)}</p>
        </div>
      )}

      {/* Active Bookings */}
      {upcomingBookings.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            {t('upcomingBookings')} ({upcomingBookings.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onCancel={(id) => setCancellingBookingId(id)}
                onRefund={(id) => setRefundingBookingId(id)}
                cancellationTimeLimit={cancellationTimeLimit}
              />
            ))}
          </div>
        </section>
      )}

      {/* Past Bookings */}
      {pastBookings.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t('pastBookings')} ({pastBookings.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pastBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {filteredBookings.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <CalendarDays className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">{t('noBookings')}</h3>
            <p className="text-gray-500 mt-1">
              {statusFilter === 'all'
                ? t('noBookingsMsg')
                : `${t('noBookings')} - ${statusFilter}`}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Refund Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!refundingBookingId}
        onClose={() => setRefundingBookingId(null)}
        onConfirm={handleRefundBooking}
        title={t('requestRefund')}
        message={
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-amber-600">
              <RotateCcw className="h-5 w-5" />
              <span className="font-medium">{t('requestRefund')}</span>
            </div>
            <p className="text-gray-600 text-sm">
              {t('refundConfirmMsg')}
            </p>
          </div>
        }
        confirmText={t('requestRefund')}
        variant="danger"
        isLoading={isRefunding}
      />

      {/* Return / Cancel Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!cancellingBookingId}
        onClose={() => setCancellingBookingId(null)}
        onConfirm={handleCancelBooking}
        title={t('returnMeal')}
        message={
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-amber-600">
              <RotateCcw className="h-5 w-5" />
              <span className="font-medium">{t('returnMeal')}</span>
            </div>
            <p className="text-gray-600 text-sm">
              {t('returnMealMsg')}
            </p>
          </div>
        }
        confirmText={t('returnMeal')}
        variant="danger"
        isLoading={isCancelling}
      />
    </div>
  )
}
