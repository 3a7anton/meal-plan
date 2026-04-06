import { create } from 'zustand'
import { supabase } from '../lib/supabaseClient'

interface SettingsState {
  bookingTimeLimit: number // minutes before meal time when booking closes
  cancellationTimeLimit: number // minutes before meal time when cancellation is allowed
  isLoading: boolean
  error: string | null

  // Actions
  fetchSettings: () => Promise<void>
  updateSetting: (key: string, value: string, userId?: string) => Promise<{ error: Error | null }>
}

const DEFAULT_BOOKING_TIME_LIMIT = 60 // 1 hour before meal time
const DEFAULT_CANCELLATION_TIME_LIMIT = 120 // 2 hours before meal time

export const useSettingsStore = create<SettingsState>((set) => ({
  bookingTimeLimit: DEFAULT_BOOKING_TIME_LIMIT,
  cancellationTimeLimit: DEFAULT_CANCELLATION_TIME_LIMIT,
  isLoading: false,
  error: null,

  fetchSettings: async () => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .in('key', ['booking_time_limit', 'cancellation_time_limit'])

      if (error) throw error

      const settings: Record<string, number> = {
        booking_time_limit: DEFAULT_BOOKING_TIME_LIMIT,
        cancellation_time_limit: DEFAULT_CANCELLATION_TIME_LIMIT,
      }

      data?.forEach((setting) => {
        settings[setting.key] = parseInt(setting.value, 10) || settings[setting.key]
      })

      set({
        bookingTimeLimit: settings.booking_time_limit,
        cancellationTimeLimit: settings.cancellation_time_limit,
      })
    } catch (error) {
      set({ error: (error as Error).message })
      // Keep defaults on error
    } finally {
      set({ isLoading: false })
    }
  },

  updateSetting: async (key: string, value: string, userId?: string) => {
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert(
          {
            key,
            value,
            updated_at: new Date().toISOString(),
            updated_by: userId || null,
          },
          { onConflict: 'key' }
        )

      if (error) throw error

      // Update local state
      if (key === 'booking_time_limit') {
        set({ bookingTimeLimit: parseInt(value, 10) })
      } else if (key === 'cancellation_time_limit') {
        set({ cancellationTimeLimit: parseInt(value, 10) })
      }

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  },
}))

// Helper function to check if booking is still allowed
export function isBookingAllowed(
  scheduledDate: string,
  timeSlot: string,
  bookingTimeLimitMinutes: number
): boolean {
  const now = new Date()
  const mealTime = new Date(scheduledDate)
  const [hours, minutes] = timeSlot.split(':')
  mealTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)

  const cutoffTime = new Date(mealTime.getTime() - bookingTimeLimitMinutes * 60 * 1000)
  return now < cutoffTime
}

// Helper function to get remaining time for booking
export function getBookingTimeRemaining(
  scheduledDate: string,
  timeSlot: string,
  bookingTimeLimitMinutes: number
): { hours: number; minutes: number; totalMinutes: number; isExpired: boolean } {
  const now = new Date()
  const mealTime = new Date(scheduledDate)
  const [hours, minutes] = timeSlot.split(':')
  mealTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)

  const cutoffTime = new Date(mealTime.getTime() - bookingTimeLimitMinutes * 60 * 1000)
  const diffMs = cutoffTime.getTime() - now.getTime()
  const totalMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)))
  const hrs = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60

  return {
    hours: hrs,
    minutes: mins,
    totalMinutes,
    isExpired: diffMs <= 0,
  }
}

// Helper function to check if cancellation is allowed
export function isCancellationAllowed(
  scheduledDate: string,
  timeSlot: string,
  cancellationTimeLimitMinutes: number
): boolean {
  const now = new Date()
  const mealTime = new Date(scheduledDate)
  const [hours, minutes] = timeSlot.split(':')
  mealTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)

  const cutoffTime = new Date(mealTime.getTime() - cancellationTimeLimitMinutes * 60 * 1000)
  return now < cutoffTime
}
