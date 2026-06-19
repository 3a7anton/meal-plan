import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { createClient } from '@supabase/supabase-js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load all env vars (including non-VITE_ prefixed ones) for server-side use
  const env = loadEnv(mode, process.cwd(), '')

  return {
  plugins: [
    react(),
    {
      name: 'api-routes',
      configureServer(server) {
        server.middlewares.use('/api/', async (req, res, next) => {
          try {
            // Extract route from URL
            const url = req.url || ''
            // When mounted at '/api/', req.url is the sub-path (e.g. '/bookings/history?...')
            const routeMatch = url.match(/^\/([^?]+)/)
            if (!routeMatch) return next()
            
            const routePath = routeMatch[1].replace(/\/$/, '')
            
            // Handle CORS for all API routes
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            
            if (req.method === 'OPTIONS') {
              res.statusCode = 200
              res.end()
              return
            }
            
            // Only handle bookings/history for now
            if (routePath === 'bookings/history') {
              
              // Get token from headers
              const authHeader = req.headers.authorization || ''
              const token = authHeader.replace('Bearer ', '')
              
              if (!token) {
                res.statusCode = 401
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: 'No authorization token' }))
                return
              }
              
              // Initialize Supabase client (use env loaded by loadEnv)
              const supabaseUrl = env.VITE_SUPABASE_URL
              const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY
              
              if (!supabaseUrl || !supabaseServiceKey) {
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: 'Server configuration error' }))
                return
              }
              
              const supabase = createClient(supabaseUrl, supabaseServiceKey)
              
              // Verify token
              const { data: { user }, error: authError } = await supabase.auth.getUser(token)
              if (authError || !user) {
                res.statusCode = 401
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: 'Invalid token' }))
                return
              }
              
              // Get user role
              const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()
              
              const isAdmin = profile?.role === 'admin' || profile?.role === 'food_editor' || 
                             profile?.role === 'finance_editor'
              
              // Parse query params
              const queryParams = new URLSearchParams(url.split('?')[1] || '')
              const startDate = queryParams.get('startDate')
              const endDate = queryParams.get('endDate')
              const status = queryParams.get('status')
              
              // Get menu schedule IDs for date filtering first
              let menuScheduleIds: string[] | null = null
              if (startDate || endDate) {
                let scheduleQuery = supabase
                  .from('menu_schedules')
                  .select('id')
                  
                if (startDate) {
                  scheduleQuery = scheduleQuery.gte('scheduled_date', startDate)
                }
                if (endDate) {
                  scheduleQuery = scheduleQuery.lte('scheduled_date', endDate)
                }
                
                const { data: schedules, error: scheduleError } = await scheduleQuery
                if (scheduleError) {
                  console.error('Error fetching schedules:', scheduleError)
                }
                menuScheduleIds = schedules?.map(s => s.id) || []
                
                if (menuScheduleIds.length === 0) {
                  // No schedules match the date range
                  res.statusCode = 200
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ 
                    success: true, 
                    data: [],
                    isAdmin 
                  }))
                  return
                }
              }
              
              // Build the final query with joins
              let finalQuery = supabase
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
              
              // Apply same filters
              if (!isAdmin) {
                finalQuery = finalQuery.eq('user_id', user.id)
              }
              if (status && status !== 'all') {
                finalQuery = finalQuery.eq('status', status)
              }
              if (menuScheduleIds && menuScheduleIds.length > 0) {
                finalQuery = finalQuery.in('menu_schedule_id', menuScheduleIds)
              }
              
              finalQuery = finalQuery.order('booked_at', { ascending: false })
              
              const { data: bookings, error } = await finalQuery
              
              if (error) {
                console.error('Error fetching bookings:', error)
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: 'Failed to fetch booking history' }))
                return
              }
              
              // Transform data
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
              
              res.statusCode = 200
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ 
                success: true, 
                data: history || [],
                isAdmin 
              }))
              return
            }
            
            next()
          } catch (error) {
            console.error('API Error:', error)
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Internal server error' }))
          }
        })
      }
    }
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-charts': ['recharts'],
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'vendor-ui': ['lucide-react', 'react-hot-toast', 'clsx', 'tailwind-merge'],
          'vendor-misc': ['zustand', 'axios', 'date-fns'],
        },
      },
    },
  },
  }
})
