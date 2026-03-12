import { useEffect, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { useAuthStore, useBookingStore } from '../../store'
import { Card, CardContent, Select, Loading } from '../../components/ui'
import { BookingCard } from '../../components/employee'
import { ConfirmDialog } from '../../components/ui/Modal'
import toast from 'react-hot-toast'

export function BookingsPage() {
  const { user } = useAuthStore()
  const { bookings, fetchUserBookings, cancelBooking, isLoading } = useBookingStore()
  
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)

  useEffect(() => {
    if (user) {
      fetchUserBookings(user.id)
    }
  }, [user, fetchUserBookings])

  const handleCancelBooking = async () => {
    if (!cancellingBookingId) return

    setIsCancelling(true)
    const result = await cancelBooking(cancellingBookingId)
    
    if (result.error) {
      toast.error(result.error.message)
    } else {
      toast.success('Booking cancelled successfully')
    }
    
    setIsCancelling(false)
    setCancellingBookingId(null)
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

  if (isLoading) {
    return <Loading fullScreen text="Loading bookings..." />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-500">Manage your meal reservations</p>
        </div>

        {/* Filters */}
        <Select
          options={[
            { value: 'all', label: 'All Bookings' },
            { value: 'pending', label: 'Pending' },
            { value: 'confirmed', label: 'Confirmed' },
            { value: 'denied', label: 'Denied' },
            { value: 'cancelled', label: 'Cancelled' },
          ]}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-40"
        />
      </div>

      {/* Active Bookings */}
      {upcomingBookings.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Active Bookings ({upcomingBookings.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onCancel={(id) => setCancellingBookingId(id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Past Bookings */}
      {pastBookings.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Past Bookings ({pastBookings.length})
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
            <h3 className="text-lg font-medium text-gray-900">No bookings found</h3>
            <p className="text-gray-500 mt-1">
              {statusFilter === 'all'
                ? "You haven't made any meal bookings yet."
                : `No ${statusFilter} bookings found.`}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!cancellingBookingId}
        onClose={() => setCancellingBookingId(null)}
        onConfirm={handleCancelBooking}
        title="Cancel Booking"
        message="Are you sure you want to cancel this booking? This action cannot be undone."
        confirmText="Cancel Booking"
        variant="danger"
        isLoading={isCancelling}
      />
    </div>
  )
}
