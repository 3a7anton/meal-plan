import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { UtensilsCrossed, CalendarDays, Clock, ArrowRight, DollarSign, AlertCircle } from 'lucide-react'
import { useAuthStore, useBookingStore, useMenuStore } from '../../store'
import { Card, CardContent, CardHeader, CardTitle, Button, CardSkeleton } from '../../components/ui'
import { BookingCard, MealCard } from '../../components/employee'
import { format } from 'date-fns'
import { supabase } from '../../lib/supabaseClient'

export function DashboardPage() {
  const { user, profile } = useAuthStore()
  const { bookings, fetchUserBookings, isLoading: bookingsLoading } = useBookingStore()
  const { schedules, fetchSchedules, isLoading: menuLoading } = useMenuStore()
  const [dueAmount, setDueAmount] = useState<number | null>(null)
  const [isLoadingDue, setIsLoadingDue] = useState(true)

  const today = format(new Date(), 'yyyy-MM-dd')
  const currentMonth = format(new Date(), 'yyyy-MM')

  useEffect(() => {
    if (user) {
      fetchUserBookings(user.id)
      fetchDueAmount(user.id)
    }
    fetchSchedules(today)
  }, [user, fetchUserBookings, fetchSchedules, today])

  const fetchDueAmount = async (userId: string) => {
    setIsLoadingDue(true)
    try {
      // First try to get unpaid payment record
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .select('amount, status')
        .eq('user_id', userId)
        .eq('month', currentMonth)
        .eq('status', 'unpaid')
        .maybeSingle()

      if (paymentError) throw paymentError

      if (paymentData) {
        console.log('Found payment record:', paymentData)
        setDueAmount(paymentData.amount || 0)
      } else {
        // Calculate from confirmed bookings this month
        const startOfMonth = `${currentMonth}-01T00:00:00`
        const endOfMonth = `${currentMonth}-30T23:59:59`
        
        console.log('Fetching bookings for user:', userId, 'from', startOfMonth, 'to', endOfMonth)
        
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select(`
            *,
            menu_schedule:menu_schedules!inner (
              *,
              meal:meals!inner (*)
            )
          `)
          .eq('user_id', userId)
          .eq('status', 'confirmed')
          .gte('booked_at', startOfMonth)
          .lte('booked_at', endOfMonth)

        if (bookingsError) {
          console.error('Bookings query error:', bookingsError)
          throw bookingsError
        }

        console.log('Raw bookings data:', bookingsData)

        const totalDue = (bookingsData || []).reduce((sum: number, booking: any) => {
          const schedulePrice = booking.menu_schedule?.price
          const mealPrice = booking.menu_schedule?.meal?.price || 0
          const price = schedulePrice ?? mealPrice // Use schedule price if set, otherwise meal price
          console.log('Booking price:', price, 'schedule:', schedulePrice, 'meal:', mealPrice)
          return sum + price
        }, 0)

        console.log('Total due calculated:', totalDue)
        setDueAmount(totalDue)
      }
    } catch (error) {
      console.error('Error fetching due amount:', error)
    } finally {
      setIsLoadingDue(false)
    }
  }

  const upcomingBookings = bookings
    .filter((b) => b.status === 'pending' || b.status === 'confirmed')
    .slice(0, 3)

  const todaysSchedules = schedules.slice(0, 4)

  const isInitialLoading = bookingsLoading && bookings.length === 0 && menuLoading && schedules.length === 0

  if (isInitialLoading) {
    return (
      <div className="space-y-6">
        {/* Welcome Header Skeleton */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 h-32 animate-pulse" />

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>

        {/* Main Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    )
  }

  const hasDue = !!(dueAmount && dueAmount > 0)

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {profile?.full_name?.split(' ')[0]}!</h1>
            <p className="mt-1 text-primary-100">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-2 border-white/30">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-white">
                {profile?.full_name?.charAt(0)?.toUpperCase() || '?'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Due Amount Alert */}
      {hasDue && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="h-12 w-12 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold text-red-800">
                ৳{dueAmount.toFixed(0)} Due This Month
              </p>
              <p className="text-sm text-red-600">
                You have unpaid meal charges. Please settle your bill.
              </p>
            </div>
            <Link to="/bookings">
              <Button variant="primary" size="sm" className="bg-red-600 hover:bg-red-700">
                View Details
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="h-12 w-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <CalendarDays className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {bookings.filter((b) => b.status === 'confirmed').length || '—'}
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
                {bookings.filter((b) => b.status === 'pending').length || '—'}
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
              <p className="text-2xl font-bold text-gray-900">{todaysSchedules.length || '—'}</p>
              <p className="text-sm text-gray-500">Available Today</p>
            </div>
          </CardContent>
        </Card>

        <Card className={hasDue ? 'border-red-200' : ''}>
          <CardContent className="flex items-center gap-4 py-4">
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${hasDue ? 'bg-red-100' : 'bg-blue-100'}`}>
              <DollarSign className={`h-6 w-6 ${hasDue ? 'text-red-600' : 'text-blue-600'}`} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${hasDue ? 'text-red-700' : 'text-gray-900'}`}>
                {isLoadingDue ? '...' : hasDue ? `৳${dueAmount!.toFixed(0)}` : '—'}
              </p>
              <p className="text-sm text-gray-500">Due This Month</p>
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
