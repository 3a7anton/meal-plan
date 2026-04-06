import { useEffect, useState } from 'react'
import { Download, Search, CheckCircle, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Select, Loading, StatusBadge } from '../../components/ui'
import { useBookingStore } from '../../store'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export function BookingManagementPage() {
  const { bookings, fetchAllBookings, updateBookingStatus, isLoading } = useBookingStore()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')

  useEffect(() => {
    fetchAllBookings()
  }, [])

  const handleApprove = async (bookingId: string) => {
    const result = await updateBookingStatus(bookingId, 'confirmed')
    if (result.error) {
      toast.error('Failed to approve booking')
    } else {
      toast.success('Booking approved')
    }
  }

  const handleDeny = async (bookingId: string) => {
    const result = await updateBookingStatus(bookingId, 'denied')
    if (result.error) {
      toast.error('Failed to deny booking')
    } else {
      toast.success('Booking denied')
    }
  }

  const handleBulkApprove = async () => {
    const pendingBookings = filteredBookings.filter((b) => b.status === 'pending')
    if (pendingBookings.length === 0) {
      toast.error('No pending bookings to approve')
      return
    }

    for (const booking of pendingBookings) {
      await updateBookingStatus(booking.id, 'confirmed')
    }
    toast.success(`${pendingBookings.length} bookings approved`)
  }

  const exportToCSV = () => {
    const headers = ['User', 'Email', 'Department', 'Meal', 'Date', 'Time', 'Status', 'Booked At']
    const rows = filteredBookings.map((b) => [
      b.profile?.full_name || 'Unknown',
      b.profile?.email || '',
      b.profile?.department || '',
      b.menu_schedule?.meal?.name || '',
      b.menu_schedule?.scheduled_date || '',
      b.menu_schedule?.time_slot || '',
      b.status,
      new Date(b.booked_at).toLocaleString(),
    ])

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bookings-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Exported to CSV')
  }

  const filteredBookings = bookings.filter((booking) => {
    // Status filter
    if (statusFilter !== 'all' && booking.status !== statusFilter) return false

    // Date filter
    if (dateFilter && booking.menu_schedule?.scheduled_date !== dateFilter) return false

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesUser = booking.profile?.full_name?.toLowerCase().includes(query)
      const matchesMeal = booking.menu_schedule?.meal?.name?.toLowerCase().includes(query)
      const matchesDept = booking.profile?.department?.toLowerCase().includes(query)
      if (!matchesUser && !matchesMeal && !matchesDept) return false
    }

    return true
  })

  const pendingCount = filteredBookings.filter((b) => b.status === 'pending').length

  if (isLoading) {
    return <Loading fullScreen text="Loading bookings..." />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Booking Management</h1>
          <p className="text-gray-500">Manage all meal bookings</p>
        </div>
        <div className="flex gap-2">
          {pendingCount > 0 && (
            <Button variant="success" onClick={handleBulkApprove}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve All Pending ({pendingCount})
            </Button>
          )}
          <Button variant="secondary" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search by user, meal, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Select
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'pending', label: 'Pending' },
                { value: 'confirmed', label: 'Confirmed' },
                { value: 'denied', label: 'Denied' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-40"
            />
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-40"
            />
            {(statusFilter !== 'all' || dateFilter || searchQuery) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setStatusFilter('all')
                  setDateFilter('')
                  setSearchQuery('')
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Bookings ({filteredBookings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredBookings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No bookings found</p>
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
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Booked At</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredBookings.map((booking) => (
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
                      <td className="px-4 py-3 text-gray-600">{booking.menu_schedule?.time_slot}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={booking.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-sm">
                        {format(new Date(booking.booked_at), 'MMM d, h:mm a')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {booking.status === 'pending' && (
                            <>
                              <Button variant="success" size="sm" onClick={() => handleApprove(booking.id)}>
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button variant="danger" size="sm" onClick={() => handleDeny(booking.id)}>
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
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
