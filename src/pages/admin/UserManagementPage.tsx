import { useEffect, useState } from 'react'
import { Search, Shield, ShieldOff, UserX, UserCheck, Users, DollarSign, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Select, Loading, Badge } from '../../components/ui'
import { ConfirmDialog } from '../../components/ui/Modal'
import { supabase } from '../../lib/supabaseClient'
import type { Profile } from '../../types'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const MAX_APPROVED_USERS = parseInt(import.meta.env.VITE_MAX_APPROVED_USERS || '0', 10)

interface ProfileWithDue extends Profile {
  due_amount?: number
}

export function UserManagementPage() {
  const [users, setUsers] = useState<ProfileWithDue[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [actionType, setActionType] = useState<'promote' | 'demote' | 'deactivate' | 'activate' | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const currentMonth = format(new Date(), 'yyyy-MM')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Fetch unpaid dues for this month
      const { data: payments } = await supabase
        .from('payments')
        .select('user_id, amount, status')
        .eq('month', currentMonth)
        .eq('status', 'unpaid')

      const usersWithDue = (data || []).map((user) => {
        const unpaidPayment = payments?.find((p) => p.user_id === user.id)
        return { ...user, due_amount: unpaidPayment?.amount || 0 }
      })

      setUsers(usersWithDue)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }

  const activeUsersCount = users.filter((u) => u.is_active).length
  const isAtLimit = MAX_APPROVED_USERS > 0 && activeUsersCount >= MAX_APPROVED_USERS

  const handleAction = async () => {
    if (!selectedUser || !actionType) return

    // Check approval limit when activating a user
    if (actionType === 'activate' && isAtLimit) {
      toast.error(`Cannot activate: Maximum limit of ${MAX_APPROVED_USERS} approved users reached`)
      setSelectedUser(null)
      setActionType(null)
      return
    }

    setIsProcessing(true)
    try {
      let updateData: Partial<Profile> = {}

      switch (actionType) {
        case 'promote':
          updateData = { role: 'admin' }
          break
        case 'demote':
          updateData = { role: 'employee' }
          break
        case 'deactivate':
          updateData = { is_active: false }
          break
        case 'activate':
          updateData = { is_active: true }
          break
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', selectedUser.id)

      if (error) throw error

      toast.success('User updated successfully')
      fetchUsers()
    } catch (error) {
      toast.error('Failed to update user')
    } finally {
      setIsProcessing(false)
      setSelectedUser(null)
      setActionType(null)
    }
  }

  const getActionMessage = () => {
    if (!selectedUser || !actionType) return ''
    const name = selectedUser.full_name

    switch (actionType) {
      case 'promote':
        return `Are you sure you want to promote ${name} to admin? They will have full access to manage the system.`
      case 'demote':
        return `Are you sure you want to demote ${name} to employee? They will lose admin privileges.`
      case 'deactivate':
        return `Are you sure you want to deactivate ${name}'s account? They will no longer be able to log in.`
      case 'activate':
        if (isAtLimit) {
          return `⚠️ WARNING: You have reached the maximum limit of ${MAX_APPROVED_USERS} approved users. You cannot activate ${name} until you deactivate another user or increase the limit.`
        }
        return `Are you sure you want to activate ${name}'s account? They will be able to log in.`
      default:
        return ''
    }
  }

  const getActionTitle = () => {
    switch (actionType) {
      case 'promote': return 'Promote to Admin'
      case 'demote': return 'Demote to Employee'
      case 'deactivate': return 'Deactivate Account'
      case 'activate': return 'Approve & Activate Account'
      default: return ''
    }
  }

  const filteredUsers = users.filter((user) => {
    if (roleFilter !== 'all' && user.role !== roleFilter) return false
    if (statusFilter === 'active' && !user.is_active) return false
    if (statusFilter === 'inactive' && user.is_active) return false
    if (statusFilter === 'pending' && user.is_active) return false

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesName = user.full_name?.toLowerCase().includes(query)
      const matchesEmail = user.email?.toLowerCase().includes(query)
      const matchesDept = user.department?.toLowerCase().includes(query)
      if (!matchesName && !matchesEmail && !matchesDept) return false
    }

    return true
  })

  const pendingCount = users.filter((u) => !u.is_active).length

  if (isLoading) {
    return <Loading fullScreen text="Loading users..." />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-500">Manage user accounts, permissions and billing dues</p>
      </div>

      {/* Limit Warning Banner */}
      {MAX_APPROVED_USERS > 0 && (
        <Card className={isAtLimit ? 'border-red-300 bg-red-50' : activeUsersCount >= MAX_APPROVED_USERS - 5 ? 'border-amber-300 bg-amber-50' : ''}>
          <CardContent className="flex items-center gap-3 py-4">
            <AlertTriangle className={`h-5 w-5 ${isAtLimit ? 'text-red-600' : activeUsersCount >= MAX_APPROVED_USERS - 5 ? 'text-amber-600' : 'text-gray-400'}`} />
            <div className="flex-1">
              <p className={`font-medium ${isAtLimit ? 'text-red-800' : activeUsersCount >= MAX_APPROVED_USERS - 5 ? 'text-amber-800' : 'text-gray-700'}`}>
                Account Limit: {activeUsersCount} / {MAX_APPROVED_USERS} approved users
              </p>
              {isAtLimit && (
                <p className="text-sm text-red-600 mt-1">
                  Maximum limit reached. Deactivate existing users before approving new ones.
                </p>
              )}
              {!isAtLimit && activeUsersCount >= MAX_APPROVED_USERS - 5 && (
                <p className="text-sm text-amber-600 mt-1">
                  Approaching limit. Only {MAX_APPROVED_USERS - activeUsersCount} slots remaining.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="h-12 w-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              <p className="text-sm text-gray-500">Total Users</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter((u) => u.role === 'admin').length}
              </p>
              <p className="text-sm text-gray-500">Admins</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter((u) => u.is_active).length}
              </p>
              <p className="text-sm text-gray-500">Active Users</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="h-12 w-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <UserX className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
              <p className="text-sm text-gray-500">Pending Approval</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search by name, email, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Select
              options={[
                { value: 'all', label: 'All Roles' },
                { value: 'admin', label: 'Admin' },
                { value: 'employee', label: 'Employee' },
              ]}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-40"
            />
            <Select
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'pending', label: 'Pending Approval' },
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-48"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">User</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Department</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Role</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Due (This Month)</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Joined</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{user.full_name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        {user.phone && <p className="text-xs text-gray-400">{user.phone}</p>}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{user.department || '-'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={user.role === 'admin' ? 'warning' : 'default'}>
                          {user.role === 'admin' ? (
                            <span className="flex items-center gap-1">
                              <Shield className="h-3 w-3" /> Admin
                            </span>
                          ) : (
                            'Employee'
                          )}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {user.is_active ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="warning">Pending</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {user.due_amount && user.due_amount > 0 ? (
                          <span className="flex items-center gap-1 text-red-600 font-medium">
                            <DollarSign className="h-4 w-4" />
                            ৳{user.due_amount.toFixed(0)}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-sm">
                        {format(new Date(user.created_at), 'MMM d, yyyy')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {user.role === 'employee' ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { setSelectedUser(user); setActionType('promote') }}
                            >
                              <Shield className="h-4 w-4 text-purple-600" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { setSelectedUser(user); setActionType('demote') }}
                            >
                              <ShieldOff className="h-4 w-4 text-gray-600" />
                            </Button>
                          )}

                          {user.is_active ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { setSelectedUser(user); setActionType('deactivate') }}
                            >
                              <UserX className="h-4 w-4 text-red-500" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { setSelectedUser(user); setActionType('activate') }}
                            >
                              <UserCheck className="h-4 w-4 text-green-500" />
                            </Button>
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

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!selectedUser && !!actionType}
        onClose={() => { setSelectedUser(null); setActionType(null) }}
        onConfirm={handleAction}
        title={getActionTitle()}
        message={getActionMessage()}
        confirmText={getActionTitle()}
        variant={actionType === 'deactivate' ? 'danger' : 'primary'}
        isLoading={isProcessing}
      />
    </div>
  )
}
