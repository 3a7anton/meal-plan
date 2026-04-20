import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

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

function canManageBookings(role: UserRole): boolean {
  return role === 'admin'
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',')
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
    // Verify user can manage bookings
    const auth = await verifyTokenWithRole(token)
    if (!auth || !canManageBookings(auth.role)) {
      return res.status(403).json({ error: 'Forbidden: Booking management access required' })
    }

    const { booking_id } = req.body

    if (!booking_id) {
      return res.status(400).json({ error: 'booking_id is required' })
    }

    // Get booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, user_id')
      .eq('id', booking_id)
      .single()

    if (bookingError || !booking) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    // Update booking status to confirmed
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({ status: 'confirmed', updated_at: new Date().toISOString() })
      .eq('id', booking_id)
      .select()
      .single()

    if (updateError) throw updateError

    // Create notification for the user
    await supabase.from('notifications').insert({
      user_id: booking.user_id,
      type: 'booking_confirmed',
      message: `Your meal booking has been confirmed!`,
    })

    return res.status(200).json(updatedBooking)
  } catch (error) {
    console.error('Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
