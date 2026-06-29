import { createClient } from '@supabase/supabase-js'

async function verifyAdmin(req: Request, supabase: any) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false
  const token = authHeader.split('Bearer ')[1]
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return false

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return profile?.role === 'admin'
}

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type'
    }})
  }

  if (req.method !== 'PATCH') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' }}
    )
  }

  try {
    const supabaseAdmin = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const isAdmin = await verifyAdmin(req, supabaseAdmin)
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: 'Forbidden' }),
        { status: 403, headers: { 'Content-Type': 'application/json' }}
      )
    }

    const { userId, amount, note } = await req.json() as any

    if (!userId || !amount || amount <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'userId and valid amount required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' }}
      )
    }

    // Get current balance
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('balance')
      .eq('id', userId)
      .single()

    if (fetchError) throw fetchError

    const currentBalance = profile?.balance || 0
    const newBalance = currentBalance + parseFloat(amount)

    // Update balance
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', userId)

    if (updateError) throw updateError

    // Send notification to user
    await supabaseAdmin.from('notifications').insert({
      user_id: userId,
      type: 'balance_added',
      message: `BDT ${amount} has been added to your account balance. ${note ? 'Note: ' + note : ''}`
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Balance updated successfully',
        data: { newBalance }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' }}
    )

  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' }}
    )
  }
}
