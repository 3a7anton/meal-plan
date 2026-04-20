import { useEffect, useState } from 'react'
import { 
  CalendarDays, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Users,
  UtensilsCrossed 
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Button, StatusBadge, CardSkeleton } from '../../components/ui'
import { useBookingStore, useAuthStore } from '../../store'
import { supabase } from '../../lib/supabaseClient'
import { canManageBookings } from '../../lib/roles'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface DashboardStats {
  totalBookingsToday: number
  pendingApprovals: number
  confirmedToday: number
  cancelledToday: number
  totalUsers: number
  activeMeals: number
}

export function AdminDashboardPage() {
  const { bookings, fetchAllBookings, updateBookingStatus, isLoading } = useBookingStore()
  const { profile } = useAuthStore()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const canApproveBookings = canManageBookings(profile)

  const today = format(new Date(), 'yyyy-MM-dd')

  useEffect(() => {
    fetchAllBookings()
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // Fetch various counts
      const [bookingsResult, usersResult, mealsResult] = await Promise.all([
        supabase
          .from('bookings')
          .select('status, menu_schedule:menu_schedules!inner(scheduled_date)')
          .eq('menu_schedule.scheduled_date', today),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('meals').select('id', { count: 'exact', head: true }).eq('is_active', true),
      ])

      const todayBookings = (bookingsResult.data || []) as { status: string }[]

      setStats({
        totalBookingsToday: todayBookings.length,
        pendingApprovals: todayBookings.filter((b) => b.status === 'pending').length,
        confirmedToday: todayBookings.filter((b) => b.status === 'confirmed').length,
        cancelledToday: todayBookings.filter((b) => b.status === 'cancelled').length,
        totalUsers: usersResult.count || 0,
        activeMeals: mealsResult.count || 0,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoadingStats(false)
    }
  }

  const handleApprove = async (bookingId: string) => {
    const result = await updateBookingStatus(bookingId, 'confirmed')
    if (result.error) {
      toast.error('Failed to approve booking')
    } else {
      toast.success('Booking approved')
      fetchStats()
    }
  }

  const handleDeny = async (bookingId: string) => {
    const result = await updateBookingStatus(bookingId, 'denied')
    if (result.error) {
      toast.error('Failed to deny booking')
    } else {
      toast.success('Booking denied')
      fetchStats()
    }
  }

  const pendingBookings = bookings.filter((b) => b.status === 'pending')

  if (loadingStats) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>

        {/* Additional Stats Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>

        {/* Pending Approvals Skeleton */}
        <CardSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="h-12 w-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <CalendarDays className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalBookingsToday}</p>
              <p className="text-sm text-gray-500">Total Today</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="h-12 w-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.pendingApprovals}</p>
              <p className="text-sm text-gray-500">Pending Approval</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.confirmedToday}</p>
              <p className="text-sm text-gray-500">Confirmed</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="h-12 w-12 bg-red-100 rounded-xl flex items-center justify-center">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.cancelledToday}</p>
              <p className="text-sm text-gray-500">Cancelled</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers}</p>
              <p className="text-sm text-gray-500">Total Users</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="h-12 w-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <UtensilsCrossed className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.activeMeals}</p>
              <p className="text-sm text-gray-500">Active Meals</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Pending Approvals ({pendingBookings.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && bookings.length === 0 ? (
            <div className="space-y-3">
              <div className="h-12 bg-gray-200 rounded animate-pulse" />
              <div className="h-12 bg-gray-200 rounded animate-pulse" />
              <div className="h-12 bg-gray-200 rounded animate-pulse" />
            </div>
          ) : pendingBookings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-300" />
              <p>No pending bookings to review</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">User</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Meal</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Time</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pendingBookings.slice(0, 10).map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{booking.profile?.full_name || 'Unknown'}</p>
                        <p className="text-sm text-gray-500">{booking.profile?.department}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-900">{booking.menu_schedule?.meal?.name}</p>
                        <p className="text-sm text-gray-500 capitalize">{booking.menu_schedule?.meal?.meal_type}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {booking.menu_schedule?.scheduled_date && 
                          format(new Date(booking.menu_schedule.scheduled_date), 'MMM d, yyyy')}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {booking.menu_schedule?.time_slot}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={booking.status} />
                      </td>
                      <td className="px-4 py-3">
                        {canApproveBookings ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handleApprove(booking.id)}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeny(booking.id)}
                            >
                              Deny
                            </Button>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">View only</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
