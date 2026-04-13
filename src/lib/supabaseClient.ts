import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Storage adapter that can switch between localStorage and sessionStorage
const storageAdapter = {
  storage: localStorage as Storage,
  setStorage(useSessionStorage: boolean) {
    this.storage = useSessionStorage ? sessionStorage : localStorage
  },
  getItem(key: string) {
    return this.storage.getItem(key)
  },
  setItem(key: string, value: string) {
    this.storage.setItem(key, value)
  },
  removeItem(key: string) {
    this.storage.removeItem(key)
  },
}

export function setAuthStorage(useSessionStorage: boolean) {
  storageAdapter.setStorage(useSessionStorage)
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storageAdapter,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
