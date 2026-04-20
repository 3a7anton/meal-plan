import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { 
  UtensilsCrossed, 
  Calendar, 
  Clock, 
  DollarSign, 
  User,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { Card, CardContent, Button, Input, Select, Badge } from '../components/ui'
import toast from 'react-hot-toast'

interface MealHistoryItem {
  id: string
  status: 'pending' | 'confirmed' | 'denied' | 'cancelled'
  notes: string | null
  booked_at: string
  updated_at: string
  user?: {
    id: string
    full_name: string
    email: string
    department: string | null
  }
  meal: {
    id: string
    name: string
    description: string | null
    meal_type: string
    image_url: string | null
  }
  schedule: {
    id: string
    scheduled_date: string
    time_slot: string
    price: number | null
  }
}

export function MealHistoryPage() {
  const [history, setHistory] = useState<MealHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    fetchHistory()
  }, [startDate, endDate, statusFilter])

  const fetchHistory = async () => {
    setIsLoading(true)
    try {
      const { data: session } = await supabase.auth.getSession()
      if (!session.session) {
        toast.error('Please log in')
        return
      }

      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (statusFilter !== 'all') params.append('status', statusFilter)

      const response = await fetch(`/api/bookings/history?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch meal history')
      }

      const result = await response.json()
      setHistory(result.data || [])
      setIsAdmin(result.isAdmin)
    } catch (error) {
      console.error('Error fetching history:', error)
      toast.error('Failed to load meal history')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      confirmed: { variant: 'success', label: 'Confirmed' },
      pending: { variant: 'warning', label: 'Pending' },
      denied: { variant: 'danger', label: 'Denied' },
      cancelled: { variant: 'default', label: 'Cancelled' }
    }
    const config = variants[status] || { variant: 'default', label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const filteredHistory = history.filter(item => {
    if (searchQuery && isAdmin) {
      const query = searchQuery.toLowerCase()
      return (
        item.user?.full_name?.toLowerCase().includes(query) ||
        item.user?.email?.toLowerCase().includes(query) ||
        item.meal?.name?.toLowerCase().includes(query)
      )
    }
    return true
  })

  const paginatedHistory = filteredHistory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage)

  const totalSpent = filteredHistory
    .filter(item => item.status === 'confirmed')
    .reduce((sum, item) => sum + (item.schedule?.price || 0), 0)

  const totalMeals = filteredHistory.filter(item => item.status === 'confirmed').length

  const handleExport = () => {
    const csv = [
      ['Date', 'Time', 'Meal', 'User', 'Department', 'Status', 'Price'].join(','),
      ...filteredHistory.map(item => [
        item.schedule?.scheduled_date,
        item.schedule?.time_slot,
        item.meal?.name,
        item.user?.full_name || 'Me',
        item.user?.department || '-',
        item.status,
        item.schedule?.price || 0
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `meal-history-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('History exported')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meal History</h1>
          <p className="text-gray-600 mt-1">
            {isAdmin ? 'View all meal bookings and history' : 'View your meal booking history'}
          </p>
        </div>
        <Button variant="outline" onClick={handleExport} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <UtensilsCrossed className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalMeals}</p>
              <p className="text-sm text-gray-500">Total Meals</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">${totalSpent.toFixed(2)}</p>
              <p className="text-sm text-gray-500">Total Spent</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{filteredHistory.length}</p>
              <p className="text-sm text-gray-500">Total Bookings</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex gap-2 items-center">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>
            
            <div>
              <label className="text-xs text-gray-500 block mb-1">From</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-40"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1">To</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-40"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1">Status</label>
              <Select
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'confirmed', label: 'Confirmed' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'denied', label: 'Denied' },
                  { value: 'cancelled', label: 'Cancelled' }
                ]}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-40"
              />
            </div>

            {isAdmin && (
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs text-gray-500 block mb-1">Search User/Meal</label>
                <Input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* History Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto" />
              <p className="mt-2 text-gray-600">Loading history...</p>
            </div>
          ) : paginatedHistory.length === 0 ? (
            <div className="p-8 text-center">
              <UtensilsCrossed className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">No meal history found</p>
              <p className="text-sm text-gray-500 mt-1">
                {startDate || endDate || statusFilter !== 'all' 
                  ? 'Try adjusting your filters'
                  : isAdmin ? 'No bookings in the system yet' : 'You haven\'t booked any meals yet'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Date & Time</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Meal</th>
                      {isAdmin && (
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">User</th>
                      )}
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-900">
                              {item.schedule?.scheduled_date 
                                ? format(parseISO(item.schedule.scheduled_date), 'MMM d, yyyy')
                                : '-'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {item.schedule?.time_slot}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {item.meal?.image_url ? (
                              <img 
                                src={item.meal.image_url} 
                                alt={item.meal.name}
                                className="h-10 w-10 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                <UtensilsCrossed className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {item.meal?.name || 'Unknown Meal'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {item.meal?.meal_type}
                              </p>
                            </div>
                          </div>
                        </td>
                        {isAdmin && (
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {item.user?.full_name || 'Unknown'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {item.user?.department || 'No Department'}
                                </p>
                              </div>
                            </div>
                          </td>
                        )}
                        <td className="px-4 py-3">
                          {getStatusBadge(item.status)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <p className="text-sm font-medium text-gray-900">
                            ${item.schedule?.price?.toFixed(2) || '0.00'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(parseISO(item.booked_at), 'MMM d, HH:mm')}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredHistory.length)} of {filteredHistory.length}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
