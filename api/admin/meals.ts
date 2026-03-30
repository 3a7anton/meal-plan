import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',')

// Columns that can be set/updated on meals
const ALLOWED_MEAL_FIELDS = ['name', 'description', 'meal_type', 'dietary_tags', 'image_url', 'is_active'] as const

async function verifyAdmin(token: string) {
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('Profile query error in verifyAdmin:', profileError)
    throw new Error('Failed to verify admin role')
  }

  if (profile?.role !== 'admin') return null
  return user
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  const origin = req.headers.origin
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Verify JWT token
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const token = authHeader.split('Bearer ')[1]

  try {
    // Verify user is admin
    const user = await verifyAdmin(token)
    if (!user) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' })
    }

    // GET - List all meals (including inactive)
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .order('meal_type', { ascending: true })
        .order('name', { ascending: true })

      if (error) throw error

      return res.status(200).json(data)
    }

    // POST - Create a new meal
    if (req.method === 'POST') {
      const { name, description, meal_type, dietary_tags, image_url } = req.body

      if (!name) {
        return res.status(400).json({ error: 'name is required' })
      }

      const mealData: Record<string, unknown> = {
        name,
        description: description || null,
        meal_type: meal_type || 'lunch',
        dietary_tags: dietary_tags || null,
        image_url: image_url || null,
        is_active: true,
      }

      const { data, error } = await supabase
        .from('meals')
        .insert(mealData)
        .select()
        .single()

      if (error) throw error

      return res.status(201).json(data)
    }

    // PUT/PATCH - Update an existing meal
    if (req.method === 'PUT' || req.method === 'PATCH') {
      const { id, ...rawFields } = req.body

      if (!id) {
        return res.status(400).json({ error: 'id is required' })
      }

      // Whitelist only allowed updatable fields
      const updateFields: Record<string, unknown> = {}
      for (const key of ALLOWED_MEAL_FIELDS) {
        if (key in rawFields) {
          updateFields[key] = rawFields[key]
        }
      }

      if (Object.keys(updateFields).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' })
      }

      const { data, error } = await supabase
        .from('meals')
        .update(updateFields)
        .eq('id', id)
        .select()
        .maybeSingle()

      if (error) throw error

      if (!data) {
        return res.status(404).json({ error: 'Meal not found' })
      }

      return res.status(200).json(data)
    }

    // DELETE - Soft delete (deactivate) a meal
    if (req.method === 'DELETE') {
      const id = req.body?.id ?? req.query?.id

      if (!id) {
        return res.status(400).json({ error: 'id is required' })
      }

      const { data, error } = await supabase
        .from('meals')
        .update({ is_active: false })
        .eq('id', id)
        .select()
        .maybeSingle()

      if (error) throw error

      if (!data) {
        return res.status(404).json({ error: 'Meal not found' })
      }

      return res.status(200).json(data)
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
