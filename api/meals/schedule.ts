import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',')

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  const origin = req.headers.origin
  res.setHeader('Access-Control-Allow-Origin', origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0])
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Verify JWT token
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const token = authHeader.split('Bearer ')[1]

  try {
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    const { date } = req.query

    if (!date || typeof date !== 'string') {
      return res.status(400).json({ error: 'date query parameter is required (format: YYYY-MM-DD)' })
    }

    // Validate YYYY-MM-DD format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'date must be in YYYY-MM-DD format' })
    }

    // Validate it's a real calendar date (rejects e.g. 2024-02-30)
    const parsed = new Date(date + 'T00:00:00Z')
    if (isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
      return res.status(400).json({ error: 'date is not a valid calendar date' })
    }

    // Fetch menu schedules for the given date with meal details
    const { data: schedules, error } = await supabase
      .from('menu_schedules')
      .select(`
        *,
        meal:meals (*)
      `)
      .eq('scheduled_date', date)
      .eq('is_available', true)
      .order('time_slot', { ascending: true })

    if (error) throw error

    // Get booking counts for each schedule
    const schedulesWithCounts = await Promise.all(
      (schedules || []).map(async (schedule: any) => {
        const { count } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('menu_schedule_id', schedule.id)
          .in('status', ['pending', 'confirmed'])

        return {
          ...schedule,
          booking_count: count || 0,
          remaining_capacity: schedule.capacity - (count || 0),
        }
      })
    )

    return res.status(200).json(schedulesWithCounts)
  } catch (error) {
    console.error('Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
