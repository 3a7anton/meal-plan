import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Global flag to determine cookie lifetime for setItem
let isRememberMe = localStorage.getItem('supabase.auth.rememberMe') === 'true'

// Custom cookie-based storage adapter
const cookieStorageAdapter = {
  getItem(key: string) {
    const cookies = document.cookie.split(';')
    const cookieKey = encodeURIComponent(key)
    for (let c of cookies) {
      c = c.trim()
      if (c.startsWith(`${cookieKey}=`)) {
        const val = c.substring(cookieKey.length + 1)
        try {
          return decodeURIComponent(val)
        } catch {
          return null
        }
      }
    }
    return null
  },
  setItem(key: string, value: string) {
    const cookieKey = encodeURIComponent(key)
    const cookieVal = encodeURIComponent(value)
    let cookie = `${cookieKey}=${cookieVal}; path=/; SameSite=Lax`
    
    if (isRememberMe) {
      // 30 days max-age
      cookie += `; max-age=${30 * 24 * 60 * 60}`
    }
    
    document.cookie = cookie
  },
  removeItem(key: string) {
    const cookieKey = encodeURIComponent(key)
    document.cookie = `${cookieKey}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
  },
}

export function setAuthStorage(rememberMe: boolean) {
  isRememberMe = rememberMe
  if (rememberMe) {
    localStorage.setItem('supabase.auth.rememberMe', 'true')
  } else {
    localStorage.removeItem('supabase.auth.rememberMe')
  }
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: cookieStorageAdapter,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
