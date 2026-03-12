import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { UtensilsCrossed, CalendarDays, Clock, ArrowRight } from 'lucide-react'
import { useAuthStore, useBookingStore, useMenuStore } from '../../store'
import { Card, CardContent, CardHeader, CardTitle, Button, Loading } from '../../components/ui'
import { BookingCard, MealCard } from '../../components/employee'
import { format } from 'date-fns'

export function DashboardPage() {
  const { user, profile } = useAuthStore()
  const { bookings, fetchUserBookings, isLoading: bookingsLoading } = useBookingStore()
  const { schedules, fetchSchedules, isLoading: menuLoading } = useMenuStore()

  const today = format(new Date(), 'yyyy-MM-dd')

  useEffect(() => {
    if (user) {
      fetchUserBookings(user.id)
    }
    fetchSchedules(today)
  }, [user, fetchUserBookings, fetchSchedules, today])

  const upcomingBookings = bookings
    .filter((b) => b.status === 'pending' || b.status === 'confirmed')
    .slice(0, 3)

  const todaysSchedules = schedules.slice(0, 4)

  if (bookingsLoading && menuLoading) {
    return <Loading fullScreen text="Loading dashboard..." />
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome back, {profile?.full_name?.split(' ')[0]}!</h1>
        <p className="mt-1 text-primary-100">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="h-12 w-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <CalendarDays className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {bookings.filter((b) => b.status === 'confirmed').length}
              </p>
              <p className="text-sm text-gray-500">Confirmed Bookings</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="h-12 w-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {bookings.filter((b) => b.status === 'pending').length}
              </p>
              <p className="text-sm text-gray-500">Pending Bookings</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
              <UtensilsCrossed className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{todaysSchedules.length}</p>
              <p className="text-sm text-gray-500">Available Today</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming Bookings</CardTitle>
            <Link to="/bookings">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingBookings.length === 0 ? (
              <div className="text-center py-8">
                <CalendarDays className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No upcoming bookings</p>
                <Link to="/menu">
                  <Button variant="primary" size="sm" className="mt-4">
                    Browse Menu
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Menu */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Today's Menu</CardTitle>
            <Link to="/menu">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {todaysSchedules.length === 0 ? (
              <div className="text-center py-8">
                <UtensilsCrossed className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No meals available today</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {todaysSchedules.slice(0, 4).map((schedule) => (
                  <MealCard key={schedule.id} schedule={schedule} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
