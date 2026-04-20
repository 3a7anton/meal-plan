import { createClient } from '@supabase/supabase-js'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { isAdmin as checkIsAdmin } from '../_utils'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',')

type UserRole = 'employee' | 'admin' | 'food_editor' | 'finance_editor'

async function verifyTokenWithRole(token: string): Promise<{ user: any, role: UserRole } | null> {
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('Profile query error:', profileError)
    return null
  }

  return { user, role: profile?.role as UserRole }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  const origin = req.headers.origin
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Verify token
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ error: 'No authorization token' })
    }

    const auth = await verifyTokenWithRole(token)
    if (!auth) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    const { user, role } = auth
    const isAdmin = checkIsAdmin(role)

    // Get query parameters
    const { userId, startDate, endDate, status } = req.query

    // Build the query
    let query = supabase
      .from('bookings')
      .select(`
        id,
        status,
        notes,
        booked_at,
        updated_at,
        user_id,
        profiles:user_id (id, full_name, email, department),
        menu_schedule:menu_schedule_id (
          id,
          scheduled_date,
          time_slot,
          price,
          meal:meal_id (id, name, description, meal_type, image_url)
        )
      `)

    // If not admin, only show own bookings
    if (!isAdmin) {
      query = query.eq('user_id', user.id)
    } else if (userId) {
      // Admin can filter by specific user
      query = query.eq('user_id', userId)
    }

    // Apply date filters
    if (startDate) {
      query = query.gte('menu_schedule.scheduled_date', startDate)
    }
    if (endDate) {
      query = query.lte('menu_schedule.scheduled_date', endDate)
    }

    // Apply status filter
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // Order by date descending
    query = query.order('booked_at', { ascending: false })

    const { data: bookings, error } = await query

    if (error) {
      console.error('Error fetching bookings:', error)
      return res.status(500).json({ error: 'Failed to fetch booking history' })
    }
    
    // Transform the data for the frontend
    const history = bookings?.map((booking: any) => ({
      id: booking.id,
      status: booking.status,
      notes: booking.notes,
      booked_at: booking.booked_at,
      updated_at: booking.updated_at,
      user: booking.profiles,
      meal: booking.menu_schedule?.meal,
      schedule: {
        id: booking.menu_schedule?.id,
        scheduled_date: booking.menu_schedule?.scheduled_date,
        time_slot: booking.menu_schedule?.time_slot,
        price: booking.menu_schedule?.price,
      }
    }))

    return res.status(200).json({ 
      success: true, 
      data: history || [],
      isAdmin 
    })

  } catch (error) {
    console.error('Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
