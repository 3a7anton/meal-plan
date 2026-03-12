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
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'PATCH') {
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

    const { booking_id } = req.body

    if (!booking_id) {
      return res.status(400).json({ error: 'booking_id is required' })
    }

    // Get booking with schedule details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        menu_schedule:menu_schedules (
          scheduled_date,
          time_slot
        )
      `)
      .eq('id', booking_id)
      .eq('user_id', user.id)
      .single()

    if (bookingError || !booking) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    // Check if booking can be cancelled (pending or confirmed)
    if (!['pending', 'confirmed'].includes(booking.status)) {
      return res.status(400).json({ error: 'This booking cannot be cancelled' })
    }

    // Check if it's more than 1 hour before the meal time
    const mealTime = new Date(`${booking.menu_schedule.scheduled_date}T${booking.menu_schedule.time_slot}`)
    const oneHourBefore = new Date(mealTime.getTime() - 60 * 60 * 1000)
    
    if (new Date() >= oneHourBefore) {
      return res.status(400).json({ error: 'Cancellation deadline has passed (1 hour before meal time)' })
    }

    // Cancel the booking
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', booking_id)
      .select()
      .single()

    if (updateError) throw updateError

    // Create notification for the user
    await supabase.from('notifications').insert({
      user_id: user.id,
      type: 'cancelled',
      message: `Your booking has been cancelled.`,
    })

    return res.status(200).json(updatedBooking)
  } catch (error) {
    console.error('Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
