import { create } from 'zustand'
import { supabase } from '../lib/supabaseClient'

interface SettingsState {
  bookingTimeLimit: number // minutes before meal time when booking closes
  cancellationTimeLimit: number // minutes before meal time when cancellation is allowed
  advancePaymentEnabled: boolean // whether advance payment feature is enabled
  isLoading: boolean
  error: string | null

  // Actions
  fetchSettings: () => Promise<void>
  updateSetting: (key: string, value: string, userId?: string) => Promise<{ error: Error | null }>
}

const DEFAULT_BOOKING_TIME_LIMIT = 60 // 1 hour before meal time
const DEFAULT_CANCELLATION_TIME_LIMIT = 120 // 2 hours before meal time
const DEFAULT_ADVANCE_PAYMENT_ENABLED = false

export const useSettingsStore = create<SettingsState>((set) => ({
  bookingTimeLimit: DEFAULT_BOOKING_TIME_LIMIT,
  cancellationTimeLimit: DEFAULT_CANCELLATION_TIME_LIMIT,
  advancePaymentEnabled: DEFAULT_ADVANCE_PAYMENT_ENABLED,
  isLoading: false,
  error: null,

  fetchSettings: async () => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .in('key', ['booking_time_limit', 'cancellation_time_limit', 'advance_payment_enabled'])

      if (error) throw error

      const settings: Record<string, number | boolean> = {
        booking_time_limit: DEFAULT_BOOKING_TIME_LIMIT,
        cancellation_time_limit: DEFAULT_CANCELLATION_TIME_LIMIT,
        advance_payment_enabled: DEFAULT_ADVANCE_PAYMENT_ENABLED,
      }

      data?.forEach((setting) => {
        if (setting.key === 'advance_payment_enabled') {
          settings[setting.key] = setting.value === 'true'
        } else {
          settings[setting.key] = parseInt(setting.value, 10) || settings[setting.key]
        }
      })

      set({
        bookingTimeLimit: settings.booking_time_limit as number,
        cancellationTimeLimit: settings.cancellation_time_limit as number,
        advancePaymentEnabled: settings.advance_payment_enabled as boolean,
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
      } else if (key === 'advance_payment_enabled') {
        set({ advancePaymentEnabled: value === 'true' })
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
