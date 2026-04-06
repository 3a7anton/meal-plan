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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
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

    const { menu_schedule_id, notes } = req.body

    if (!menu_schedule_id) {
      return res.status(400).json({ error: 'menu_schedule_id is required' })
    }

    // Get schedule details
    const { data: schedule, error: scheduleError } = await supabase
      .from('menu_schedules')
      .select('scheduled_date, time_slot, capacity')
      .eq('id', menu_schedule_id)
      .single()

    if (scheduleError || !schedule) {
      return res.status(404).json({ error: 'Schedule not found' })
    }

    // Check if user already has a booking at this time slot
    const { data: existingBooking, error: existingError } = await supabase
      .from('bookings')
      .select(`
        id,
        menu_schedule:menu_schedules!inner (
          scheduled_date,
          time_slot
        )
      `)
      .eq('user_id', user.id)
      .in('status', ['pending', 'confirmed'])

    if (existingError) throw existingError

    const hasConflict = existingBooking?.some(
      (booking: any) => {
        const ms = Array.isArray(booking.menu_schedule) ? booking.menu_schedule[0] : booking.menu_schedule
        return ms?.scheduled_date === schedule.scheduled_date && ms?.time_slot === schedule.time_slot
      }
    )

    if (hasConflict) {
      return res.status(409).json({ error: 'You already have a booking at this time slot' })
    }

    // Check slot capacity
    const { count, error: countError } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('menu_schedule_id', menu_schedule_id)
      .in('status', ['pending', 'confirmed'])

    if (countError) throw countError

    if (count !== null && count >= schedule.capacity) {
      return res.status(409).json({ error: 'This time slot is fully booked' })
    }

    // Create the booking
    const { data: newBooking, error: createError } = await supabase
      .from('bookings')
      .insert({
        user_id: user.id,
        menu_schedule_id,
        status: 'pending',
        notes: notes || null,
      })
      .select()
      .single()

    if (createError) throw createError

    // Create notification for the user
    await supabase.from('notifications').insert({
      user_id: user.id,
      type: 'reminder',
      message: `Your booking is pending approval.`,
    })

    return res.status(201).json(newBooking)
  } catch (error) {
    console.error('Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
