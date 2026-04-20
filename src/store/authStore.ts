import { create } from 'zustand'
import { supabase, setAuthStorage } from '../lib/supabaseClient'
import type { Profile } from '../types'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  profile: Profile | null
  session: Session | null
  isLoading: boolean
  isInitialized: boolean
  
  // Actions
  initialize: () => Promise<void>
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: Error | null; pendingApproval?: boolean }>
  signUp: (data: SignUpData) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  fetchProfile: (userId: string) => Promise<void>
  updateProfile: (updates: Partial<Pick<Profile, 'full_name' | 'phone' | 'department' | 'avatar_url'>>) => Promise<{ error: Error | null }>
  sendPasswordResetCode: (email: string) => Promise<{ error: Error | null }>
  verifyCodeAndResetPassword: (email: string, code: string, newPassword: string) => Promise<{ error: Error | null }>
}

interface SignUpData {
  email: string
  password: string
  fullName: string
  phone?: string
  department?: string
}

let authSubscription: { unsubscribe: () => void } | null = null

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  session: null,
  isLoading: true,
  isInitialized: false,

  initialize: async () => {
    try {
      // Cleanup previous listener to prevent duplicates
      authSubscription?.unsubscribe()

      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        set({ user: session.user, session })
        await get().fetchProfile(session.user.id)
      }
      
      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        set({ user: session?.user || null, session })
        
        if (session?.user) {
          await get().fetchProfile(session.user.id)
        } else {
          set({ profile: null })
        }
      })
      authSubscription = subscription
    } catch (error) {
      console.error('Auth initialization error:', error)
    } finally {
      set({ isLoading: false, isInitialized: true })
    }
  },

  signIn: async (email: string, password: string, rememberMe = false) => {
    set({ isLoading: true })
    try {
      // Set storage type based on rememberMe (false = sessionStorage, true = localStorage)
      setAuthStorage(!rememberMe)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        await get().fetchProfile(data.user.id)
        const profile = get().profile

        // Block inactive (pending approval) users
        if (profile && !profile.is_active) {
          await supabase.auth.signOut()
          set({ user: null, profile: null, session: null })
          return { error: new Error('Your account is pending admin approval.'), pendingApproval: true }
        }
      }

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    } finally {
      set({ isLoading: false })
    }
  },

  signUp: async (data: SignUpData) => {
    set({ isLoading: true })
    try {
      const { error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            phone: data.phone || null,
            department: data.department || null,
          },
        },
      })

      if (authError) throw authError

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    } finally {
      set({ isLoading: false })
    }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null, session: null })
  },

  fetchProfile: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) throw error

      if (data) {
        set({ profile: data })
      } else {
        // Profile doesn't exist yet — may be a trigger timing issue
        await new Promise((r) => setTimeout(r, 1000))
        const { data: retryData, error: retryError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle()

        if (retryError) {
          console.error('Profile retry failed:', retryError)
        }
        set({ profile: retryData ?? null })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  },

  updateProfile: async (updates) => {
    const { user } = get()
    if (!user) return { error: new Error('Not authenticated') }

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)

      if (error) throw error

      // Refresh local profile
      await get().fetchProfile(user.id)
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  },

  sendPasswordResetCode: async (email: string) => {
    set({ isLoading: true })
    try {
      // Use Supabase built-in password reset (sends magic link to email)
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    } finally {
      set({ isLoading: false })
    }
  },

  verifyCodeAndResetPassword: async (_email: string, _code: string, newPassword: string) => {
    set({ isLoading: true })
    try {
      // Update password using Supabase (user is already authenticated via magic link)
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    } finally {
      set({ isLoading: false })
    }
  },
}))
