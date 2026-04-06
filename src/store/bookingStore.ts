import { create } from 'zustand'
import { supabase } from '../lib/supabaseClient'
import type { BookingWithDetails, MenuScheduleWithMeal } from '../types'

interface BookingState {
  bookings: BookingWithDetails[]
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchUserBookings: (userId: string) => Promise<void>
  fetchAllBookings: () => Promise<BookingWithDetails[]>
  createBooking: (menuScheduleId: string, userId: string, notes?: string) => Promise<{ error: Error | null }>
  cancelBooking: (bookingId: string) => Promise<{ error: Error | null }>
  updateBookingStatus: (bookingId: string, status: 'confirmed' | 'denied' | 'cancelled') => Promise<{ error: Error | null }>
  checkConflict: (userId: string, date: string, timeSlot: string) => Promise<boolean>
}

export const useBookingStore = create<BookingState>((set, get) => ({
  bookings: [],
  isLoading: false,
  error: null,

  fetchUserBookings: async (userId: string) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          menu_schedule:menu_schedules (
            *,
            meal:meals (*)
          )
        `)
        .eq('user_id', userId)
        .order('booked_at', { ascending: false })

      if (error) throw error

      set({ bookings: data as BookingWithDetails[] })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ isLoading: false })
    }
  },

  fetchAllBookings: async () => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          menu_schedule:menu_schedules (
            *,
            meal:meals (*)
          ),
          profile:profiles (*)
        `)
        .order('booked_at', { ascending: false })

      if (error) throw error

      set({ bookings: data as BookingWithDetails[] })
      return data as BookingWithDetails[]
    } catch (error) {
      set({ error: (error as Error).message })
      return []
    } finally {
      set({ isLoading: false })
    }
  },

  createBooking: async (menuScheduleId: string, userId: string, notes?: string) => {
    try {
      // Use atomic database function to prevent race conditions
      const { error } = await supabase.rpc('create_booking_atomic', {
        p_user_id: userId,
        p_menu_schedule_id: menuScheduleId,
        p_notes: notes || null,
      })

      if (error) {
        // Check for foreign key constraint violation
        if (error.message?.includes('bookings_user_id_fkey')) {
          return { error: new Error('User profile not found. Please complete your profile first.') }
        }
        throw new Error(error.message)
      }

      // Refresh bookings
      await get().fetchUserBookings(userId)

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  },

  cancelBooking: async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' as const, updated_at: new Date().toISOString() })
        .eq('id', bookingId)

      if (error) throw error

      // Update local state
      set((state) => ({
        bookings: state.bookings.map((b) =>
          b.id === bookingId ? { ...b, status: 'cancelled' } : b
        ),
      }))

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  },

  updateBookingStatus: async (bookingId: string, status: 'confirmed' | 'denied' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', bookingId)

      if (error) throw error

      // Update local state
      set((state) => ({
        bookings: state.bookings.map((b) =>
          b.id === bookingId ? { ...b, status } : b
        ),
      }))

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  },

  checkConflict: async (userId: string, date: string, timeSlot: string) => {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        menu_schedule:menu_schedules!inner (
          scheduled_date,
          time_slot
        )
      `)
      .eq('user_id', userId)
      .in('status', ['pending', 'confirmed'])

    if (error) {
      console.error('Error checking conflict:', error)
      return false
    }

    type BookingWithSchedule = { id: string; menu_schedule: { scheduled_date: string; time_slot: string } | { scheduled_date: string; time_slot: string }[] }
    return (data as unknown as BookingWithSchedule[]).some(
      (booking) => {
        const schedule = Array.isArray(booking.menu_schedule) 
          ? booking.menu_schedule[0] 
          : booking.menu_schedule
        return schedule?.scheduled_date === date && schedule?.time_slot === timeSlot
      }
    )
  },
}))

// Menu store for fetching schedules
interface MenuState {
  schedules: MenuScheduleWithMeal[]
  isLoading: boolean
  error: string | null
  
  fetchSchedules: (date: string) => Promise<void>
  fetchSchedulesByDateRange: (startDate: string, endDate: string) => Promise<void>
}

export const useMenuStore = create<MenuState>((set) => ({
  schedules: [],
  isLoading: false,
  error: null,

  fetchSchedules: async (date: string) => {
    set({ isLoading: true, error: null })
    try {
      // Fetch schedules and booking counts in parallel
      const [{ data: schedulesData, error: schedulesError }, { data: bookingsData }] = await Promise.all([
        supabase
          .from('menu_schedules')
          .select(`
            *,
            meal:meals (*)
          `)
          .eq('scheduled_date', date)
          .eq('is_available', true)
          .order('time_slot', { ascending: true }),
        supabase
          .from('bookings')
          .select('menu_schedule_id')
          .eq('status', 'confirmed')
          .or('status.eq.pending')
      ])

      if (schedulesError) throw schedulesError

      // Count bookings per schedule in memory
      const bookingCounts: Record<string, number> = {}
      if (bookingsData) {
        for (const booking of bookingsData) {
          bookingCounts[booking.menu_schedule_id] = (bookingCounts[booking.menu_schedule_id] || 0) + 1
        }
      }

      type ScheduleWithMeal = MenuScheduleWithMeal & { id: string; capacity: number }
      
      const schedulesWithCounts = ((schedulesData || []) as ScheduleWithMeal[]).map((schedule) => ({
        ...schedule,
        booking_count: bookingCounts[schedule.id] || 0,
        remaining_capacity: schedule.capacity - (bookingCounts[schedule.id] || 0),
      }))

      set({ schedules: schedulesWithCounts as MenuScheduleWithMeal[] })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ isLoading: false })
    }
  },

  fetchSchedulesByDateRange: async (startDate: string, endDate: string) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('menu_schedules')
        .select(`
          *,
          meal:meals (*)
        `)
        .gte('scheduled_date', startDate)
        .lte('scheduled_date', endDate)
        .eq('is_available', true)
        .order('scheduled_date', { ascending: true })
        .order('time_slot', { ascending: true })

      if (error) throw error

      set({ schedules: data as MenuScheduleWithMeal[] })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ isLoading: false })
    }
  },
}))
