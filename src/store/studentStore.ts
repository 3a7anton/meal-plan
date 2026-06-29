import { create } from 'zustand'
import { supabase } from '../lib/supabaseClient'
import { useAuthStore } from './authStore'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TiffinMenuItem {
  id: string
  meal_id: string
  scheduled_date: string
  time_slot: string
  capacity: number
  price: number
  is_available: boolean
  ordering_deadline_hours?: number
  created_at: string
  meal: {
    id: string
    name: string
    description: string | null
    meal_type: string
    dietary_tags: string[] | null
    image_url: string | null
  } | null
}

export interface StudentPaymentSummary {
  id: string
  status: 'pending' | 'success' | 'failed' | 'cancelled'
  amount: number
  currency: string
  tran_id: string | null
  created_at: string
}

export interface StudentOrder {
  id: string
  student_id: string
  tiffin_menu_id: string
  status: 'pending' | 'paid' | 'cancelled' | 'delivered'
  quantity: number
  total_amount: number
  order_date: string
  meal_date: string
  created_at: string
  updated_at: string
  tiffin_menu: TiffinMenuItem | null
  payment: StudentPaymentSummary | null
}

export interface StudentMenuGrouped {
  [timeSlot: string]: TiffinMenuItem[]
}

// ─── State ──────────────────────────────────────────────────────────────────

interface StudentState {
  // Menu
  menu: StudentMenuGrouped
  menuDate: string | null
  isLoadingMenu: boolean

  // Orders
  orders: StudentOrder[]
  upcomingOrders: StudentOrder[]
  pastOrders: StudentOrder[]
  isLoadingOrders: boolean

  // Actions
  fetchMenu: () => Promise<void>
  fetchOrders: () => Promise<void>
  createOrder: (tiffinMenuId: string, quantity?: number) => Promise<{ error: Error | null; order?: StudentOrder }>
  cancelOrder: (orderId: string) => Promise<{ error: Error | null }>
  payWithBalance: (orderId: string) => Promise<{ error: Error | null }>
  initiatePayment: (orderId: string) => Promise<{ error: Error | null; paymentUrl?: string; tranId?: string }>
}

// ─── Helper ─────────────────────────────────────────────────────────────────

async function getAuthHeader(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ? `Bearer ${session.access_token}` : null
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useStudentStore = create<StudentState>((set, get) => ({
  menu: {},
  menuDate: null,
  isLoadingMenu: false,

  orders: [],
  upcomingOrders: [],
  pastOrders: [],
  isLoadingOrders: false,

  fetchMenu: async () => {
    set({ isLoadingMenu: true })
    try {
      const token = await getAuthHeader()
      if (!token) throw new Error('Not authenticated')

      const res = await fetch('/api/student/menu', {
        headers: { Authorization: token },
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Failed to fetch menu: ${res.status} ${res.statusText}`)
      }
      const data = await res.json()
      console.log('Student menu API response:', data)
      set({ menu: data.menu ?? {}, menuDate: data.date ?? null })
    } catch (error) {
      console.error('fetchMenu error:', error)
      // Store an empty menu on error so it shows "No tiffin scheduled" instead of hanging
      set({ menu: {}, menuDate: null })
    } finally {
      set({ isLoadingMenu: false })
    }
  },

  fetchOrders: async () => {
    set({ isLoadingOrders: true })
    try {
      const token = await getAuthHeader()
      if (!token) throw new Error('Not authenticated')

      const res = await fetch('/api/student/orders/list', {
        headers: { Authorization: token },
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to fetch orders')
      }
      const data = await res.json()
      set({
        orders: [...(data.upcoming ?? []), ...(data.past ?? [])],
        upcomingOrders: data.upcoming ?? [],
        pastOrders: data.past ?? [],
      })
    } catch (error) {
      console.error('fetchOrders error:', error)
    } finally {
      set({ isLoadingOrders: false })
    }
  },

  createOrder: async (tiffinMenuId, quantity = 1) => {
    try {
      const token = await getAuthHeader()
      if (!token) return { error: new Error('Not authenticated') }

      const res = await fetch('/api/student/orders/create', {
        method: 'POST',
        headers: { Authorization: token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ tiffin_menu_id: tiffinMenuId, quantity }),
      })
      const data = await res.json()
      if (!res.ok) return { error: new Error(data.error || 'Failed to create order') }

      // Refresh orders list
      await get().fetchOrders()
      return { error: null, order: data.order }
    } catch (error) {
      return { error: error as Error }
    }
  },

  cancelOrder: async (orderId) => {
    try {
      const token = await getAuthHeader()
      if (!token) return { error: new Error('Not authenticated') }

      // Update status directly via Supabase client (student can update own rows per RLS)
      const { error } = await supabase
        .from('student_orders')
        // @ts-ignore
        .update({ status: 'cancelled' })
        .eq('id', orderId)

      if (error) return { error: new Error(error.message) }

      // Optimistically update local state
      set((state) => ({
        orders: state.orders.map((o) =>
          o.id === orderId ? { ...o, status: 'cancelled' as const } : o
        ),
        upcomingOrders: state.upcomingOrders.filter((o) => o.id !== orderId),
        pastOrders: state.pastOrders.map((o) =>
          o.id === orderId ? { ...o, status: 'cancelled' as const } : o
        ),
      }))

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  },

  payWithBalance: async (orderId) => {
    try {
      const token = await getAuthHeader()
      if (!token) return { error: new Error('Not authenticated') }

      const state = get()
      const order = state.orders.find(o => o.id === orderId)
      if (!order) return { error: new Error('Order not found') }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { error: new Error('Not authenticated') }

      // Deduct balance
      const { error: balanceError } = await supabase.rpc('deduct_meal_balance' as any, {
        p_user_id: user.id,
        p_amount: order.total_amount
      } as any)
      
      if (balanceError) throw balanceError

      // Update status directly via Supabase client (student can update own rows per RLS)
      const { error } = await supabase
        .from('student_orders')
        // @ts-ignore
        .update({ status: 'paid' })
        .eq('id', orderId)

      if (error) return { error: new Error(error.message) }

      // Optimistically update local state
      set((state) => ({
        orders: state.orders.map((o) =>
          o.id === orderId ? { ...o, status: 'paid' as const } : o
        ),
        upcomingOrders: state.upcomingOrders.map((o) =>
          o.id === orderId ? { ...o, status: 'paid' as const } : o
        ),
        pastOrders: state.pastOrders.map((o) =>
          o.id === orderId ? { ...o, status: 'paid' as const } : o
        ),
      }))

      // trigger fetch profile to update balance in auth store
      useAuthStore.getState().fetchProfile(user.id)

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  },

  initiatePayment: async (orderId) => {
    try {
      const token = await getAuthHeader()
      if (!token) return { error: new Error('Not authenticated') }

      const res = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { Authorization: token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId }),
      })
      const data = await res.json()
      if (!res.ok) return { error: new Error(data.error || 'Failed to initiate payment') }

      return { error: null, paymentUrl: data.payment_url, tranId: data.tran_id }
    } catch (error) {
      return { error: error as Error }
    }
  },
}))
