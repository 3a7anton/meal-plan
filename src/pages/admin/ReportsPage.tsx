import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, Loading, Select } from '../../components/ui'
import { supabase } from '../../lib/supabaseClient'
import { format, subDays } from 'date-fns'

interface BookingStats {
  date: string
  count: number
}

interface StatusDistribution {
  name: string
  value: number
}

interface DepartmentStats {
  department: string
  count: number
}

interface MealPopularity {
  name: string
  count: number
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: '#10B981',
  pending: '#F59E0B',
  denied: '#EF4444',
  cancelled: '#6B7280',
}

type ReportBooking = {
  booked_at: string
  status: string
  quantity?: number
  profile?: { department: string | null }
  menu_schedule?: { scheduled_date: string; meal: { name: string } | null }
}

export function ReportsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week')
  const [bookingsByDate, setBookingsByDate] = useState<BookingStats[]>([])
  const [statusDistribution, setStatusDistribution] = useState<StatusDistribution[]>([])
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([])
  const [mealPopularity, setMealPopularity] = useState<MealPopularity[]>([])

  useEffect(() => {
    fetchReportData()
  }, [timeRange])

  const fetchReportData = async () => {
    setIsLoading(true)
    const endDate = new Date()
    const startDate = timeRange === 'week' ? subDays(endDate, 7) : subDays(endDate, 30)

    try {
      // Fetch all bookings in date range
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          *,
          menu_schedule:menu_schedules (
            scheduled_date,
            meal:meals (name)
          ),
          profile:profiles (department)
        `)
        .gte('booked_at', startDate.toISOString())
        .lte('booked_at', endDate.toISOString())

      if (error) throw error

      const typedBookings = (bookings || []) as ReportBooking[]

      // Process bookings by date (accounting for quantity)
      const dateMap = new Map<string, number>()
      const days = timeRange === 'week' ? 7 : 30
      for (let i = 0; i < days; i++) {
        const date = format(subDays(endDate, days - 1 - i), 'yyyy-MM-dd')
        dateMap.set(date, 0)
      }

      typedBookings.forEach((booking) => {
        const date = format(new Date(booking.booked_at), 'yyyy-MM-dd')
        if (dateMap.has(date)) {
          dateMap.set(date, (dateMap.get(date) || 0) + (booking.quantity || 1))
        }
      })

      setBookingsByDate(
        Array.from(dateMap.entries()).map(([date, count]) => ({
          date: format(new Date(date), 'MMM d'),
          count,
        }))
      )

      // Process status distribution (accounting for quantity)
      const statusMap = new Map<string, number>()
      typedBookings.forEach((booking) => {
        statusMap.set(booking.status, (statusMap.get(booking.status) || 0) + (booking.quantity || 1))
      })

      setStatusDistribution(
        Array.from(statusMap.entries()).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
        }))
      )

      // Process department stats (accounting for quantity)
      const deptMap = new Map<string, number>()
      typedBookings.forEach((booking) => {
        const dept = booking.profile?.department || 'Unknown'
        deptMap.set(dept, (deptMap.get(dept) || 0) + (booking.quantity || 1))
      })

      setDepartmentStats(
        Array.from(deptMap.entries())
          .map(([department, count]) => ({ department, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
      )

      // Process meal popularity (accounting for quantity)
      const mealMap = new Map<string, number>()
      typedBookings.forEach((booking) => {
        const mealName = booking.menu_schedule?.meal?.name || 'Unknown'
        mealMap.set(mealName, (mealMap.get(mealName) || 0) + (booking.quantity || 1))
      })

      setMealPopularity(
        Array.from(mealMap.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
      )
    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <Loading fullScreen text="Loading reports..." />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500">Analytics and insights</p>
        </div>
        <Select
          options={[
            { value: 'week', label: 'Last 7 days' },
            { value: 'month', label: 'Last 30 days' },
          ]}
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as 'week' | 'month')}
          className="w-40"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bookings Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Bookings Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bookingsByDate}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusDistribution.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={STATUS_COLORS[entry.name.toLowerCase()] || '#6B7280'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Bookings by Department */}
        <Card>
          <CardHeader>
            <CardTitle>Bookings by Department</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="department" type="category" tick={{ fontSize: 12 }} width={100} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="count" fill="#10B981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Most Popular Meals */}
        <Card>
          <CardHeader>
            <CardTitle>Most Popular Meals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mealPopularity} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={120} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="count" fill="#F59E0B" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-gray-900">
                {bookingsByDate.reduce((sum, d) => sum + d.count, 0)}
              </p>
              <p className="text-sm text-gray-500">Total Bookings</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">
                {statusDistribution.find((s) => s.name === 'Confirmed')?.value || 0}
              </p>
              <p className="text-sm text-gray-500">Confirmed</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-3xl font-bold text-yellow-600">
                {statusDistribution.find((s) => s.name === 'Pending')?.value || 0}
              </p>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-3xl font-bold text-red-600">
                {(statusDistribution.find((s) => s.name === 'Cancelled')?.value || 0) +
                  (statusDistribution.find((s) => s.name === 'Denied')?.value || 0)}
              </p>
              <p className="text-sm text-gray-500">Cancelled/Denied</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
